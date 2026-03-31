const express = require('express');
const router = express.Router();
const axios = require('axios');
const Interaction = require('../models/Interaction');
const { auth } = require('../middleware/auth');

// --- CAU HINH TU DONG TRAIN AI ---
let interactionCounter = 0;
const TRAIN_THRESHOLD = 5; // Nguong 100 luot tuong tac
let isTraining = false; 

const triggerAutoTrain = async () => {
    if (isTraining) return; 
    
    try {
        isTraining = true;
        
        // BUOC QUAN TRONG: Reset bien dem ngay khi bat dau goi lenh Train
        // Dieu nay giup cac luot xem phat sinh TRONG LUC dang train se duoc tinh cho dot sau
        interactionCounter = 0; 
        
        console.log("--- AI SYSTEM: Dang tu dong kich hoat Train (Nguong 100) ---");
        
        const response = await axios.post("http://127.0.0.1:8000/train");
        
        if (response.data.success) {
            console.log("--- AI SYSTEM: AI da hoc xong! San sang cho dot tiep theo. ---");
        }
    } catch (error) {
        console.error("--- AI SYSTEM ERROR: Tu dong Train that bai:", error.message);
        // Neu train loi, co the de lai 1 phan bien dem de thu lai sau (tuy ban chon)
    } finally {
        isTraining = false;
    }
};

// API: Luu lai tuong tac cua nguoi dung
router.post('/', auth, async (req, res) => {
    try {
        const { productId, action } = req.body;
        const userId = req.user.id;

        let score = 1;
        if (action === 'cart') score = 3;
        if (action === 'buy') score = 5;

        let interaction = await Interaction.findOne({ userId, productId, action });

        if (interaction) {
            interaction.updatedAt = Date.now();
            await interaction.save();
        } else {
            interaction = new Interaction({ userId, productId, action, score });
            await interaction.save();
        }

        // --- LOGIC DEM VA KICH HOAT TRAIN ---
        interactionCounter++;
        console.log(`[AI Counter] Tien do: ${interactionCounter}/${TRAIN_THRESHOLD}`);

        if (interactionCounter >= TRAIN_THRESHOLD && !isTraining) {
            // Goi ham train va khong await de User khong phai doi
            triggerAutoTrain();
        }

        res.status(200).json({ success: true, message: "Da ghi nhan tuong tac" });
    } catch (error) {
        console.error("Loi luu interaction:", error);
        res.status(500).json({ success: false, message: "Loi may chu noi bo" });
    }
});

module.exports = router;