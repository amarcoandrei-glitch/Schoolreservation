import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "./firebase";

export type UserRole = "student" | "faculty" | "admin";

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  studentId: string;
  isActive: boolean;
}

export async function registerUser(data: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
  department: string;
  studentId: string;
}): Promise<UserProfile> {
  const credential = await createUserWithEmailAndPassword(
    auth,
    data.email,
    data.password,
  );
  const fullName = `${data.firstName} ${data.lastName}`;

  await updateProfile(credential.user, {
    displayName: fullName,
  });

  const profile: Omit<UserProfile, "uid"> & {
    createdAt: unknown;
  } = {
    name: fullName,
    email: data.email,
    role: data.role,
    department: data.department,
    studentId: data.studentId,
    isActive: true,
    createdAt: serverTimestamp(),
  };

  await setDoc(doc(db, "users", credential.user.uid), profile);

  return {
    uid: credential.user.uid,
    ...profile,
    createdAt: undefined,
  } as UserProfile;
}

export async function loginUser(
  email: string,
  password: string,
): Promise<UserProfile> {
  const credential = await signInWithEmailAndPassword(
    auth,
    email,
    password,
  );
  const snap = await getDoc(
    doc(db, "users", credential.user.uid),
  );

  if (!snap.exists()) {
    throw new Error(
      "User profile not found. Please contact support.",
    );
  }

  return {
    uid: credential.user.uid,
    ...snap.data(),
  } as UserProfile;
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

export async function createAdminUser(data: {
  email: string;
  password: string;
  name: string;
  department?: string;
  employeeId?: string;
}): Promise<UserProfile> {
  const credential = await createUserWithEmailAndPassword(
    auth,
    data.email,
    data.password,
  );
  await updateProfile(credential.user, {
    displayName: data.name,
  });

  const profile = {
    name: data.name,
    email: data.email,
    role: "admin" as UserRole,
    department: data.department ?? "Administration",
    studentId: data.employeeId ?? "",
    isActive: true,
    createdAt: serverTimestamp(),
  };

  await setDoc(doc(db, "users", credential.user.uid), profile);

  return {
    uid: credential.user.uid,
    ...profile,
    createdAt: undefined,
  } as UserProfile;
}