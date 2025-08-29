import { adminDb } from '@/lib/firebase-admin';
import { VoiceCategory } from '@/types/voices';
import 'dotenv/config';

const DEFAULT_CATEGORIES: Omit<VoiceCategory, 'id' | 'created_at'>[] = [
  {
    name: 'general',
    description: 'General purpose voices for everyday use',
    icon: '🎤',
  },
  {
    name: 'emotions',
    description: 'Voices with emotional expressiveness',
    icon: '😊',
  },
  {
    name: 'stream',
    description: 'Voices optimized for streaming content',
    icon: '📺',
  },
  {
    name: 'car_talk',
    description: 'Voices perfect for automotive content',
    icon: '🚗',
  },
  {
    name: 'podcast',
    description: 'Professional podcast voices',
    icon: '🎧',
  },
  {
    name: 'vlog',
    description: 'Casual vlogging voices',
    icon: '📹',
  },
  {
    name: 'forum',
    description: 'Community and forum discussion voices',
    icon: '💬',
  },
  {
    name: 'coaching',
    description: 'Motivational and coaching voices',
    icon: '💪',
  },
  {
    name: 'news',
    description: 'Professional news and reporting voices',
    icon: '📰',
  },
  {
    name: 'storytelling',
    description: 'Narrative and storytelling voices',
    icon: '📚',
  },
];

async function populateVoiceCategories() {
  try {
    console.log('Starting voice category population...');

    let createdCount = 0;
    let updatedCount = 0;
    let errorCount = 0;

    for (const category of DEFAULT_CATEGORIES) {
      try {
        // Check if category already exists
        const existingCategory = await adminDb
          .collection('templates/voices/categories')
          .where('name', '==', category.name)
          .get();

        if (existingCategory.empty) {
          // Create new category document
          await adminDb.collection('templates/voices/categories').add({
            ...category,
            created_at: new Date(),
          });
          console.log(`✅ Created category: ${category.name}`);
          createdCount++;
        } else {
          // Update existing category
          const docId = existingCategory.docs[0].id;
          await adminDb.collection('templates/voices/categories').doc(docId).update({
            ...category,
            updated_at: new Date(),
          });
          console.log(`🔄 Updated category: ${category.name}`);
          updatedCount++;
        }
      } catch (error) {
        console.error(`❌ Error processing category ${category.name}:`, error);
        errorCount++;
      }
    }

    console.log('\n=== Voice Category Population Summary ===');
    console.log(`✅ Created: ${createdCount} categories`);
    console.log(`🔄 Updated: ${updatedCount} categories`);
    console.log(`❌ Errors: ${errorCount} categories`);
    console.log(`📊 Total processed: ${DEFAULT_CATEGORIES.length} categories`);
    console.log('Voice category population completed successfully');
  } catch (error) {
    console.error('❌ Error populating voice categories:', error);
    process.exit(1);
  }
}

// Run the script if called directly
if (require.main === module) {
  populateVoiceCategories()
    .then(() => {
      console.log('Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

export { populateVoiceCategories }; 