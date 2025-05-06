// NÃO importe node-fetch; use o fetch global do Vercel
export default async function handler(req, res) {
    try {
      const input = req.query.input;
      if (!input) return res.status(400).json({ error: 'missing input' });
  
      const key = process.env.google_maps_key;
      if (!key) {
        console.error("google_maps_key is not set");
        return res.status(500).json({ error: 'API key not configured' });
      }
  
      // Monta URL via URLSearchParams para evitar concatenações manuais
      const params = new URLSearchParams({
        key,
        input,
        types: 'address',
        components: 'country:br'
      });
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params}`;
  
      const r = await fetch(url);
      if (!r.ok) {
        console.error('Google API returned status', r.status);
        return res.status(500).json({ error: 'Google API error' });
      }
      const data = await r.json();
      return res.status(200).json(data);
  
    } catch (err) {
      console.error("Unhandled error in /api/places:", err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  