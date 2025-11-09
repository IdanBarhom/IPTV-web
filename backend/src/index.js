//import
const express = require('express');  // server
const cors = require('cors');   // to allow access from frontend
const dotenv = require('dotenv'); //load environment variables

// loading environment variables from .env file
dotenv.config();

// create express app
const app = express();

// port configuration
const PORT = process.env.PORT || 5000;

// middlewares
app.use(cors());  // allows access from frontend
app.use(express.json());  // allows reading JSON from requests  


const channelsRouter = require('./routes/channels');
app.get('/', (req, res) => {
    res.json({
        message: 'IPTV API Server',
        version: '1.0.0',
        endpoints: {
            channels: '/api/channels',
            users: '/api/user (coming soon)',
            auth: '/api/auth (coming soon)'
        }
    });
});
app.use('/api/channels', channelsRouter);

app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found'
    });
}); 
// start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
