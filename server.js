import express from 'express';
import cors from 'cors';
import compression from 'compression';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import connectDB from './config/db.js';
import foodRoutes from './routes/popularFoodItems.Routes.js';
import authRoutes from './routes/authRoutes.js';
import uploadRoutes from './routes/upload.Routes.js';
import packagesRoutes from './routes/packages.Routes.js';
import blogsRoutes from './routes/blogsRoutes.js';
import occasionsRoutes from './routes/occasions.Routes.js';
import servicesRoutes from './routes/services.Routes.js';
import categoriesRoutes from './routes/categories.Routes.js';
import youtubeRoutes from './routes/youtube.Routes.js';
import rangeMenusRoutes from './routes/rangeMenus.Routes.js';
import menuItemsRoutes from './routes/menuItems.Routes.js';


dotenv.config();

connectDB();

const app = express();
const PORT = 5000;
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:3000'
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(compression());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

app.use('/api/food', foodRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/packages', packagesRoutes);
app.use('/api/blogs', blogsRoutes);
app.use('/api/occasions', occasionsRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/youtube', youtubeRoutes);
app.use('/api/range-menus', rangeMenusRoutes);
app.use('/api/menu-items', menuItemsRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
