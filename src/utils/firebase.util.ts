// utils/firebaseUtils.ts
import { db } from "../firebase";

export const saveToDB = async <T>(path: string, data: T): Promise<string> => {
  try {
    const newRef = db.ref(path).push();
    await newRef.set(data);
    return newRef.key!;
  } catch (error) {
    console.error(`Error saving to DB at path "${path}":`, error);
    throw new Error("Failed to save data to the database.");
  }
};

export const updateInDB = async <T>(
  path: string,
  id: string,
  updates: Partial<T>
): Promise<void> => {
  try {
    await db.ref(`${path}/${id}`).update(updates);
  } catch (error) {
    console.error(`Error updating item at "${path}/${id}":`, error);
    throw new Error("Failed to update item in the database.");
  }
};

export const deleteFromDB = async (path: string, id: string): Promise<void> => {
  try {
    await db.ref(`${path}/${id}`).remove();
  } catch (error) {
    console.error(`Error deleting item at "${path}/${id}":`, error);
    throw new Error("Failed to delete item from the database.");
  }
};

export const getAllFromDB = async <T>(
  path: string
): Promise<Record<string, T>> => {
  try {
    const snapshot = await db.ref(path).get();
    if (!snapshot.exists()) return {};
    return snapshot.val() as Record<string, T>;
  } catch (error) {
    console.error(`Error fetching all items from "${path}":`, error);
    throw new Error("Failed to retrieve data from the database.");
  }
};

export const getOneFromDB = async <T>(
  path: string,
  id: string
): Promise<T | null> => {
  try {
    const snapshot = await db.ref(`${path}/${id}`).get();
    if (!snapshot.exists()) return null;
    return snapshot.val() as T;
  } catch (error) {
    console.error(`Error fetching item at "${path}/${id}":`, error);
    throw new Error("Failed to retrieve item from the database.");
  }
};
