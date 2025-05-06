// /api/places.js
export default async function handler(req, res) {
  try {
    const input = req.query.input;
    if (!input) return res.status(400).json({ error: 'missing input' });

    const key = process.env.google_maps_key;
    if (!key) return res.status(500).json({ error: 'API key not configured' });

    const params = new URLSearchParams({
      key,
      input,
      types: 'address',
      components: 'country:br',
      language: 'pt-BR'              // <— força português
    });

    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params}`;
    const r = await fetch(url);
    if (!r.ok) return res.status(500).json({ error: 'Google API error' });
    const data = await r.json();
    return res.status(200).json(data);
  } catch (err) {
    console.error("Error in /api/places:", err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
