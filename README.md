# 🧟 Dead Zone

> Zombie survival shooter 3D — onde infinite, sopravvivenza estrema.

**🎮 [Gioca ora →](https://deadzone-psi.vercel.app)**

---

## 💻 Requisiti Hardware
 
**📋 MINIMI**
| Componente | Requisito |
|-----------|-----------|
| GPU | GTX 550 Ti / HD 6790 |
| RAM | 4 GB |
| CPU | Intel i3 6100 / AMD FX-6130 |
 
**📋 CONSIGLIATI**
| Componente | Requisito |
|-----------|-----------|
| GPU | GTX 750 Ti / RX 550 |
| RAM | 8 GB |
| CPU | Intel i5 6400 / AMD FX-8320 |

---

## 🚀 Installazione & Avvio

```bash
# 1. Clona il repo
git clone https://github.com/iir3sp3ctm3ii-max/Dead-Zone.git

# 2. Entra nella cartella
cd Dead-Zone

# 3. Installa le dipendenze
npm install --legacy-peer-deps

# 4. Avvia il gioco in locale
npm run dev
```

Apri il browser su **http://localhost:5173**

---

## 🎮 Controlli

| Tasto | Azione |
|-------|--------|
| `W A S D` | Muoversi |
| `Mouse` | Guardare in giro |
| `Click sinistro` | Sparare |
| `R` | Ricaricare |
| `1 / 2 / 3` | Cambiare arma |
| `F` | Comprare arma dal muro |
| `P` | Pausa |
| `ESC` | Uscire dal gioco |

### 📱 Mobile
Su telefono appaiono automaticamente:
- **Joystick sinistro** — muoversi
- **Swipe area destra** — ruotare la camera
- **Pulsante SPARA** — sparare
- **Pulsante RICARICA** — ricaricare
- **Frecce ◀▶** — cambiare arma

---

## 🔫 Armi

| Arma | Costo | Munizioni | Note |
|------|-------|-----------|------|
| Pistola 1911 | Gratis | 8 / 48 | Arma iniziale |
| Shotgun | 1500 pt | 6 / 30 | 6 pallettoni per colpo |
| SMG | 3000 pt | 30 / 120 | Fuoco automatico |

Le armi si comprano sui **pannelli luminosi sui muri** con il tasto `F`.

---

## 🧟 Gameplay

- Gli zombie arrivano in **onde infinite** — ogni onda è più difficile
- Uccidi zombie per guadagnare **punti**
- Ogni onda completata: **+500 pt** e **+20 salute**
- La salute si rigenera automaticamente ogni 10 secondi

---

I file ottimizzati vengono generati nella cartella `dist/`.

---

## 🧰 Stack tecnologico

- **React** + **TypeScript**
- **Three.js** + **@react-three/fiber** — rendering 3D
- **@react-three/drei** — helpers 3D
- **Vite** — bundler

---

## 📜 Licenza

Progetto personale — tutti i diritti riservati.
