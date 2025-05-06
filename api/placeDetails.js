// api/placeDetails.js
export default async function handler(req, res) {
    const placeId = req.query.place_id;
    if (!placeId) return res.status(400).json({ error: 'place_id is required' });
  
    const key = process.env.google_maps_key;
    if (!key) return res.status(500).json({ error: 'API key not configured' });
  
    const params = new URLSearchParams({
      key,
      place_id: placeId,
      fields: 'address_component',
      language: 'pt-BR'
    });
    const url = `https://maps.googleapis.com/maps/api/place/details/json?${params}`;
  
    const r = await fetch(url);
    if (!r.ok) return res.status(500).json({ error: 'Place Details API error' });
  
    const json = await r.json();
    return res.status(200).json(json.result);
  }
  