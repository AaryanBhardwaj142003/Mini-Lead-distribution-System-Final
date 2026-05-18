import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { LogIn } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const [loginError, setLoginError] = React.useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setLoginError(null);
    try {
      let userCredential;
      try {
        userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      } catch (e: any) {
        // If login fails for credential reasons, auto-register them
        if (e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential' || e.code === 'auth/invalid-login-credentials' || e.code === 'auth/wrong-password') {
          try {
            userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
            const role = data.email.includes('admin') ? 'admin' : 'agent';
            await setDoc(doc(db, 'users', userCredential.user.uid), {
              name: data.email.split('@')[0],
              email: data.email,
              role,
              lastAssigned: null
            });
          } catch (createErr: any) {
            if (createErr.code === 'auth/email-already-in-use') {
              throw new Error('Account exists with a different password. Please try again.');
            }
            throw createErr;
          }
        } else {
          throw e; // throw original error if not a standard credential issue
        }
      }

      let role = data.email.includes('admin') ? 'admin' : 'agent';
      try {
        const userDocRef = doc(db, 'users', userCredential.user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists() && userDoc.data().role) {
          role = userDoc.data().role;
        } else {
          // If the user document doesn't exist (e.g. created from admin dashboard previously but crashed), create it now.
          await setDoc(userDocRef, {
              name: data.email.split('@')[0],
              email: data.email,
              role,
              lastAssigned: null
          }, { merge: true });
        }
      } catch (docErr) {
        console.warn('Could not fetch/set user document, falling back to email-based role', docErr);
      }

      if (role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/agent');
      }
    } catch (err: any) {
      console.error("Login Error details:", err);
      if (err.code === 'auth/operation-not-allowed') {
        setLoginError('Email/Password sign-in is disabled. Please go to your Firebase Console -> Authentication -> Sign-in method, and enable "Email/Password".');
      } else if (err.code === 'permission-denied') {
        setLoginError('Firestore permission denied. Check security rules.');
      } else {
        setLoginError('Login failed: ' + (err.message || err.toString()));
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 text-blue-600 rounded-xl mb-4">
            <LogIn className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome Back</h1>
          <p className="text-slate-500 mt-2">Enter your credentials to access your dashboard</p>
        </div>

        {loginError && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-semibold">
            {loginError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              {...register('email')}
              type="email"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="name@company.com"
            />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              {...register('password')}
              type="password"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="••••••••"
            />
            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg transition-colors shadow-md shadow-indigo-200 flex items-center justify-center"
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-3">Quick Access (Demo)</p>
            <div className="flex gap-2 justify-center">
                <button type="button" onClick={() => onSubmit({email: 'admin@demo.com', password: 'password123'})} className="text-xs px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600 transition-colors cursor-pointer">Admin Portal</button>
                <button type="button" onClick={() => onSubmit({email: 'agent@demo.com', password: 'password123'})} className="text-xs px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600 transition-colors cursor-pointer">Agent Portal</button>
            </div>
        </div>
      </motion.div>
    </div>
  );
}
