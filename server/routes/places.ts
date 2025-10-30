import { Router, Request, Response } from 'express';
import axios from 'axios';

const router = Router();
const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

router.get('/autocomplete', async (req: Request, res: Response) => {
  try {
    const { input } = req.query;

    if (!input) {
      return res.status(400).json({ message: '需要輸入地點' });
    }

    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${input}&key=${GOOGLE_API_KEY}&components=country:tw`
    );

    res.json(response.data);
  } catch (error) {
    console.error('❌ 地點搜索失敗:', error);
    res.status(500).json({ message: '搜索失敗' });
  }
});

router.get('/geocode-reverse', async (req: Request, res: Response) => {
  try {
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ message: '需要經緯度' });
    }

    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_API_KEY}`
    );

    res.json(response.data);
  } catch (error) {
    console.error('❌ 地址查詢失敗:', error);
    res.status(500).json({ message: '查詢失敗' });
  }
});

export default router;