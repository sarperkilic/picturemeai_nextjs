import { adminDb } from '@/lib/firebase-admin';
import { VoiceTemplate } from '@/types/voices';
import 'dotenv/config';

async function populateVoicesFromElevenLabs() {
  try {
    // Check if ELEVENLABS_API_KEY is available
    if (!process.env.ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY environment variable is required');
    }

    console.log('Starting voice population from ElevenLabs API...');

    // Fetch voices from ElevenLabs API
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API Response:', errorText);
      throw new Error(`ElevenLabs API error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    const voices = data.voices || [];

    console.log(`Found ${voices.length} voices from ElevenLabs`);

    // Process and store each voice
    let createdCount = 0;
    let updatedCount = 0;
    let errorCount = 0;

    for (const voice of voices) {
      try {
        const voiceTemplate: Omit<VoiceTemplate, 'id'> = {
          voice_id: voice.voice_id,
          name: voice.name,
          description: voice.description || '',
          category: voice.labels?.category || 'general',
          gender: voice.labels?.gender || 'neutral',
          age_group: voice.labels?.age,
          accent: voice.labels?.accent,
          language: voice.verified_languages?.[0]?.language || 'en',
          preview_url: voice.preview_url,
          labels: voice.labels || {},
          settings: voice.settings || {
            stability: 0.5,
            similarity_boost: 0.5,
            style: 0.0,
            speed: 1.0,
          },
          is_public: true,
          created_at: new Date(),
          updated_at: new Date(),
        };

        // Check if voice already exists
        const existingVoice = await adminDb
          .collection('templates/voices/voices')
          .where('voice_id', '==', voice.voice_id)
          .get();

        if (existingVoice.empty) {
          // Create new voice document
          await adminDb.collection('templates/voices/voices').add(voiceTemplate);
          console.log(`✅ Created voice: ${voice.name}`);
          createdCount++;
        } else {
          // Update existing voice
          const docId = existingVoice.docs[0].id;
          await adminDb.collection('templates/voices/voices').doc(docId).update({
            ...voiceTemplate,
            updated_at: new Date(),
          });
          console.log(`🔄 Updated voice: ${voice.name}`);
          updatedCount++;
        }
      } catch (error) {
        console.error(`❌ Error processing voice ${voice.name}:`, error);
        errorCount++;
      }
    }

    console.log('\n=== Voice Population Summary ===');
    console.log(`✅ Created: ${createdCount} voices`);
    console.log(`🔄 Updated: ${updatedCount} voices`);
    console.log(`❌ Errors: ${errorCount} voices`);
    console.log(`📊 Total processed: ${voices.length} voices`);
    console.log('Voice population completed successfully');
  } catch (error) {
    console.error('❌ Error populating voices:', error);
    process.exit(1);
  }
}

// Run the script if called directly
if (require.main === module) {
  populateVoicesFromElevenLabs()
    .then(() => {
      console.log('Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

export { populateVoicesFromElevenLabs }; 