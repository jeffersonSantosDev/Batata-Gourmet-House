// Aqui rodam no Node no Vercel, portanto process.env funciona
import fetch from 'node-fetch';

export default async function handler(req, res) {
  const input = req.query.input;
  if (!input) return res.status(400).json({ error: 'missing input' });

  const key = process.env.google_maps_key; 
  if (!key) return res.status(500).json({ error: 'API key not configured' });

  const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json`
    + `?key=${key}`
    + `&input=${encodeURIComponent(input)}`
    + `&types=address`
    + `&components=country:br`;

  try {
    const r = await fetch(url);
    const data = await r.json();
    res.status(200).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Places fetch failed' });
  }
}
