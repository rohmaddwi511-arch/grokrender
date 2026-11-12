const express = require('express');
const cors = require('cors');
const { Connection, Keypair, LAMPORTS_PER_SOL, SystemProgram, Transaction, sendAndConfirmTransaction } = require('@solana/web3.js');
const bs58 = require('bs58');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const RPC_URL = 'https://mainnet.helius-rpc.com/?api-key=602e66cb-b862-4819-9286-92b6801ae2a3';
const connection = new Connection(RPC_URL, 'confirmed');

const privKeyStr = process.env.BOT_PRIVATE_KEY || "";
let botKeypair = null;

try {
    if (privKeyStr) {
        botKeypair = Keypair.fromSecretKey(bs58.decode(privKeyStr));
        console.log("🤖 Dompet Bot berhasil dimuat:", botKeypair.publicKey.toString());
    } else {
        console.log("⚠️ Peringatan: Private Key bot belum diisi!");
    }
} catch (e) {
    console.error("❌ Format Private Key salah (harus Base58)");
}

app.post('/api/snipe-buy', async (req, res) => {
    const { tokenAddress, amountSol, tp, sl } = req.body;
    if (!botKeypair) {
        return res.status(400).json({ success: false, error: "Dompet bot belum dikonfigurasi di server!" });
    }

    try {
        const transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: botKeypair.publicKey,
                toPubkey: botKeypair.publicKey,
                lamports: Math.floor(amountSol * LAMPORTS_PER_SOL),
            })
        );

        const signature = await sendAndConfirmTransaction(connection, transaction, [botKeypair]);
        res.json({ success: true, signature: signature, message: `Berhasil beli ${amountSol} SOL untuk token ${tokenAddress}` });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server Backend aktif di port ${PORT}`);
});
