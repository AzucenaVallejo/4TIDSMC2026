
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyA9DdaXQA4KTATV13LY8OCYHWo6Ta1RMSU",
    authDomain: "portafoliodeevidencias-2b1c2.firebaseapp.com",
    projectId: "portafoliodeevidencias-2b1c2",
    storageBucket: "portafoliodeevidencias-2b1c2.firebasestorage.app",
    messagingSenderId: "717279369315",
    appId: "1:717279369315:web:ded213904add73c08a0056"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar autenticación
const auth = getAuth(app);

export {
    app,
    auth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile
};