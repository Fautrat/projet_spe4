import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const PORT = Number(process.env.PORT) || 3000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const app = express();

app.use(cors({ origin: CLIENT_URL }));
app.use(express.json());

app.get('/api/health', (req, res) => {
  	res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  	console.log(`API démarrée sur http://localhost:${PORT}`);
});
