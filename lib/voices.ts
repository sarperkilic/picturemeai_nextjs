import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy, limit, startAfter, doc, getDoc } from 'firebase/firestore';
import { VoiceTemplate, VoiceCategory } from '@/types/voices';

const VOICES_COLLECTION = 'templates/voices/voices';
const CATEGORIES_COLLECTION = 'templates/voices/categories';

export async function getVoiceTemplates(options: {
  category?: string;
  gender?: string;
  language?: string;
  limit?: number;
  startAfterDoc?: any;
} = {}): Promise<VoiceTemplate[]> {
  try {
    const { category, gender, language, limit: limitCount = 50, startAfterDoc } = options;
    
    let q = query(
      collection(db, VOICES_COLLECTION),
      orderBy('name'),
      limit(limitCount)
    );

    if (category) {
      q = query(q, where('category', '==', category));
    }

    if (gender) {
      q = query(q, where('gender', '==', gender));
    }

    if (language) {
      q = query(q, where('language', '==', language));
    }

    if (startAfterDoc) {
      q = query(q, startAfter(startAfterDoc));
    }

    const querySnapshot = await getDocs(q);
    const voices: VoiceTemplate[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      voices.push({
        id: doc.id,
        ...data,
        created_at: data.created_at?.toDate(),
        updated_at: data.updated_at?.toDate(),
      } as VoiceTemplate);
    });

    return voices;
  } catch (error) {
    console.error('Error fetching voice templates:', error);
    throw error;
  }
}

export async function getVoiceTemplateById(voiceId: string): Promise<VoiceTemplate | null> {
  try {
    const docRef = doc(db, VOICES_COLLECTION, voiceId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        created_at: data.created_at?.toDate(),
        updated_at: data.updated_at?.toDate(),
      } as VoiceTemplate;
    }

    return null;
  } catch (error) {
    console.error('Error fetching voice template:', error);
    throw error;
  }
}

export async function getVoiceCategories(): Promise<VoiceCategory[]> {
  try {
    const querySnapshot = await getDocs(collection(db, CATEGORIES_COLLECTION));
    const categories: VoiceCategory[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      categories.push({
        id: doc.id,
        ...data,
        created_at: data.created_at?.toDate(),
      } as VoiceCategory);
    });

    return categories;
  } catch (error) {
    console.error('Error fetching voice categories:', error);
    throw error;
  }
}

export async function searchVoiceTemplates(searchTerm: string, options: {
  category?: string;
  gender?: string;
  language?: string;
} = {}): Promise<VoiceTemplate[]> {
  try {
    // Get all voices and filter client-side for better search experience
    const voices = await getVoiceTemplates({ ...options, limit: 1000 });
    
    if (!searchTerm) return voices;

    const searchLower = searchTerm.toLowerCase();
    return voices.filter(voice =>
      voice.name.toLowerCase().includes(searchLower) ||
      voice.description.toLowerCase().includes(searchLower) ||
      Object.values(voice.labels).some(label => 
        label.toLowerCase().includes(searchLower)
      )
    );
  } catch (error) {
    console.error('Error searching voice templates:', error);
    throw error;
  }
} 