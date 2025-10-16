// api/log_data.js
import { createClient } from '@supabase/supabase-js';
// IKKE NØDVENDIG: import { v4 as uuidv4 } from 'uuid'; // Fjern denne linjen

// Importer 'crypto' som er en innebygd modul i Node.js
// Siden Node.js 19+, er crypto.randomUUID() tilgjengelig globalt,
// men for eldre Node.js-versjoner i Vercel (eller sikkerhet), er det greit å importere.
// For Vercel's Node.js runtime (som ofte er relativt ny), kan du sannsynligvis kalle den direkte
// som `crypto.randomUUID()`. Men å importere er alltid tryggest.
import crypto from 'crypto';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Kun POST er tillatt' });
  }

  try {
    const { page, event_description, klartekst_input, session_uid: client_session_uid } = req.body;
    const ip_adresse = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    let session_uid = client_session_uid;

    // Hvis klientsiden ikke sendte en UID, generer en ny ved å bruke innebygd funksjon
    if (!session_uid) {
      session_uid = crypto.randomUUID(); // <-- Bruker innebygd funksjon!
      console.log('Genererte ny session_uid på serveren (uten pakke):', session_uid);
    } else {
      console.log('Mottok session_uid fra klienten:', session_uid);
    }

    const { data, error } = await supabase
      .from('data')
      .insert({
        kildeside: page,
        input_type: event_description,
        input_verdi: klartekst_input,
        ip_adresse: ip_adresse,
        session_uid: session_uid,
      });

    if (error) { throw error; }

    res.status(200).json({ message: 'Data logget i den nye tabellen!', session_uid: session_uid });
  } catch (error) {
    console.error('Supabase error:', error);
    res.status(500).json({ message: `Serverfeil: ${error.message}` });
  }
}
