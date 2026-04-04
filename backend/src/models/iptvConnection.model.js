import mongoose from 'mongoose';


const iptvConnectionSchema = new mongoose.Schema(
    {
        baseUrl: {
        type: String,
        required: true,
        },
        username: {
        type: String,
        required: true, 
        },
      // will crypte in the future
        password: {
        type: String,
        required: true,
        select: false, 
        },
        apiUrl: {
        type: String,
        required: true, 
        },

        // 🔹 user_info from the server
        status: {
        type: String,
        enum: ['Active', 'Expired', 'Trial', 'Invalid'],
        default: 'Active', 
        },
        auth: {
        type: Number, 
        },
        message: {
        type: String, 
        },
        expDateRaw: {
        type: String, 
        },
        expiresAt: {
        type: Date, // the same exp_date translated to a real date
        },
        isTrial: {
        type: Boolean,
        default: false, // is_trial === "0" → false
        },
        activeCons: {
        type: Number,
        default: 0, // "active_cons": "0"
        },
        maxConnections: {
        type: Number,
        default: 1, // "max_connections": "1"
        },
        allowedOutputFormats: {
        type: [String],
        default: [], // ["m3u8","ts","rtmp"]
        },
        createdAtRaw: {
        type: String, // "1762375764"
        },

        // 🔹 server_info from the server
        serverUrl: {
        type: String, // "a10.lion.wine"
        },
        serverPort: {
        type: String, // "80"
        },
        httpsPort: {
        type: String, // "443"
        },
        serverProtocol: {
        type: String, // "http"
        },
        rtmpPort: {
        type: String, // "25462"
        },
        timezone: {
        type: String, // "Europe/Amsterdam"
        },
        serverTimestampNow: {
        type: Number, // 1763309551
        },
        serverTimeNow: {
        type: String, // "2025-11-16 17:12:31"
        },
        process: {
        type: Boolean, // true
        },

        // 🔹 Backup of the original JSON
        rawUserInfo: {
        type: mongoose.Schema.Types.Mixed,
        },
        rawServerInfo: {
        type: mongoose.Schema.Types.Mixed,
        },

        // 🔹 Refresh token (SHA-256 hash stored, never plaintext)
        refreshToken: {
        type: String,
        select: false,
        },

        // 🔹 Subscription
        subscriptionTier: {
        type: String,
        enum: ['free', 'premium', 'family'],
        default: 'free',
        },
        subscriptionExpiresAt: {
        type: Date,
        default: null,
        },

        // 🔹 Admin
        isAdmin: {
        type: Boolean,
        default: false,
        },

        // 🔹 Favorites
        favorites: [{
        type:     { type: String, enum: ['live', 'vod', 'series'], required: true },
        streamId: { type: String, required: true },
        title:    { type: String, default: '' },
        addedAt:  { type: Date,   default: Date.now },
        }],

        // 🔹 Watch History
        watchHistory: [{
        type:      { type: String, enum: ['live', 'vod', 'series'], required: true },
        streamId:  { type: String, required: true },
        title:     { type: String, default: '' },
        watchedAt: { type: Date,   default: Date.now },
        }],
    },
    {
    timestamps: true, 
    }
);

const IptvConnection = mongoose.model('IptvConnection', iptvConnectionSchema);

export default IptvConnection;