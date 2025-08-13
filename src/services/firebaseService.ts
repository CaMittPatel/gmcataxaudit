import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { TaskEntry, Client, User } from '../types';

// Collections
const COLLECTIONS = {
  TASK_ENTRIES: 'taskEntries',
  CLIENTS: 'clients',
  USERS: 'users'
};

// Task Entries Service
export const taskEntriesService = {
  // Add new task entry
  async add(entry: Omit<TaskEntry, 'id' | 'timestamp'>) {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.TASK_ENTRIES), {
        ...entry,
        timestamp: serverTimestamp(),
        lastStatusUpdate: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding task entry:', error);
      throw error;
    }
  },

  // Get all task entries
  async getAll(): Promise<TaskEntry[]> {
    try {
      const querySnapshot = await getDocs(
        query(collection(db, COLLECTIONS.TASK_ENTRIES), orderBy('timestamp', 'desc'))
      );
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || new Date().toISOString(),
        lastStatusUpdate: doc.data().lastStatusUpdate?.toDate?.()?.toISOString()
      })) as TaskEntry[];
    } catch (error) {
      console.error('Error getting task entries:', error);
      throw error;
    }
  },

  // Get task entries by client
  async getByClient(clientName: string): Promise<TaskEntry[]> {
    try {
      const querySnapshot = await getDocs(
        query(
          collection(db, COLLECTIONS.TASK_ENTRIES),
          where('clientName', '==', clientName),
          orderBy('timestamp', 'desc')
        )
      );
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || new Date().toISOString(),
        lastStatusUpdate: doc.data().lastStatusUpdate?.toDate?.()?.toISOString()
      })) as TaskEntry[];
    } catch (error) {
      console.error('Error getting task entries by client:', error);
      throw error;
    }
  },

  // Update task entry
  async update(id: string, updates: Partial<TaskEntry>) {
    try {
      const docRef = doc(db, COLLECTIONS.TASK_ENTRIES, id);
      await updateDoc(docRef, {
        ...updates,
        lastStatusUpdate: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating task entry:', error);
      throw error;
    }
  },

  // Delete task entry
  async delete(id: string) {
    try {
      await deleteDoc(doc(db, COLLECTIONS.TASK_ENTRIES, id));
    } catch (error) {
      console.error('Error deleting task entry:', error);
      throw error;
    }
  },

  // Real-time listener
  onSnapshot(callback: (entries: TaskEntry[]) => void) {
    return onSnapshot(
      query(collection(db, COLLECTIONS.TASK_ENTRIES), orderBy('timestamp', 'desc')),
      (querySnapshot) => {
        const entries = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || new Date().toISOString(),
          lastStatusUpdate: doc.data().lastStatusUpdate?.toDate?.()?.toISOString()
        })) as TaskEntry[];
        callback(entries);
      },
      (error) => {
        console.error('Error in task entries listener:', error);
      }
    );
  }
};

// Clients Service
export const clientsService = {
  // Add new client
  async add(client: Omit<Client, 'id' | 'lastUpdated'>) {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.CLIENTS), {
        ...client,
        lastUpdated: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding client:', error);
      throw error;
    }
  },

  // Get all clients
  async getAll(): Promise<Client[]> {
    try {
      const querySnapshot = await getDocs(
        query(collection(db, COLLECTIONS.CLIENTS), orderBy('name'))
      );
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        lastUpdated: doc.data().lastUpdated?.toDate?.()?.toISOString() || new Date().toISOString()
      })) as Client[];
    } catch (error) {
      console.error('Error getting clients:', error);
      throw error;
    }
  },

  // Update client
  async update(id: string, updates: Partial<Client>) {
    try {
      const docRef = doc(db, COLLECTIONS.CLIENTS, id);
      await updateDoc(docRef, {
        ...updates,
        lastUpdated: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating client:', error);
      throw error;
    }
  },

  // Delete client
  async delete(id: string) {
    try {
      await deleteDoc(doc(db, COLLECTIONS.CLIENTS, id));
    } catch (error) {
      console.error('Error deleting client:', error);
      throw error;
    }
  },

  // Bulk add clients (for import)
  async bulkAdd(clients: Omit<Client, 'id' | 'lastUpdated'>[]) {
    try {
      const promises = clients.map(client => 
        addDoc(collection(db, COLLECTIONS.CLIENTS), {
          ...client,
          lastUpdated: serverTimestamp()
        })
      );
      
      const results = await Promise.all(promises);
      return results.map(docRef => docRef.id);
    } catch (error) {
      console.error('Error bulk adding clients:', error);
      throw error;
    }
  },

  // Real-time listener
  onSnapshot(callback: (clients: Client[]) => void) {
    return onSnapshot(
      query(collection(db, COLLECTIONS.CLIENTS), orderBy('name')),
      (querySnapshot) => {
        const clients = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          lastUpdated: doc.data().lastUpdated?.toDate?.()?.toISOString() || new Date().toISOString()
        })) as Client[];
        callback(clients);
      },
      (error) => {
        console.error('Error in clients listener:', error);
      }
    );
  }
};

// Users Service
export const usersService = {
  // Add new user
  async add(user: Omit<User, 'id'>) {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.USERS), {
        ...user,
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding user:', error);
      throw error;
    }
  },

  // Get all users
  async getAll(): Promise<User[]> {
    try {
      const querySnapshot = await getDocs(
        query(collection(db, COLLECTIONS.USERS), orderBy('username'))
      );
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        lastLogin: doc.data().lastLogin?.toDate?.()?.toISOString()
      })) as User[];
    } catch (error) {
      console.error('Error getting users:', error);
      throw error;
    }
  },

  // Update user
  async update(id: string, updates: Partial<User>) {
    try {
      const docRef = doc(db, COLLECTIONS.USERS, id);
      const updateData: any = { ...updates };
      
      if (updates.lastLogin) {
        updateData.lastLogin = serverTimestamp();
      }
      
      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  // Get user by username
  async getByUsername(username: string): Promise<User | null> {
    try {
      const querySnapshot = await getDocs(
        query(collection(db, COLLECTIONS.USERS), where('username', '==', username))
      );
      
      if (querySnapshot.empty) {
        return null;
      }
      
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        lastLogin: doc.data().lastLogin?.toDate?.()?.toISOString()
      } as User;
    } catch (error) {
      console.error('Error getting user by username:', error);
      throw error;
    }
  }
};

// Initialize default admin user if not exists
export const initializeDefaultUser = async () => {
  try {
    const existingAdmin = await usersService.getByUsername('Admin');
    
    if (!existingAdmin) {
      await usersService.add({
        username: 'Admin',
        password: 'admin123',
        rights: 'Top Level Rights',
        createdAt: new Date().toISOString()
      });
      console.log('Default admin user created');
    }
  } catch (error) {
    console.error('Error initializing default user:', error);
  }
};