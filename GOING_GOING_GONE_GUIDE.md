# Going, Going, Gone Auction System 🔨

## Overview

The "Going, Going, Gone" auction system is a traditional auction house feature that creates urgency and excitement by announcing warnings before closing an auction. This eBay-style system ensures fair bidding by giving participants multiple chances to place their final bids.

## How It Works

### 3-Stage Warning System

1. **GOING ONCE! 🔨** (30 seconds after last bid)
   - Displayed with yellow-orange warning banner
   - Toast notification: "⚠️ GOING ONCE! Place your bid now!"
   - Users have 30 seconds to place a new bid

2. **GOING TWICE! 🔨🔨** (30 seconds after first warning)
   - Displayed with red-pink warning banner
   - Toast notification: "🚨 GOING TWICE! Last chance to bid!"
   - Users have 30 seconds to place a new bid

3. **SOLD! 🎉** (30 seconds after second warning)
   - Displayed with green success banner
   - Toast notification: "🎉 SOLD! Auction has ended!"
   - Auction automatically closes
   - Winner is determined

### Timer Reset

- **New Bid Placed**: Timer completely resets to zero
- **Warning Count**: Reset to 0
- **Fresh Start**: Full 30-second cycle begins again

## Features Implemented

### Backend Changes

1. **Auction Model** (`backend/models/Auction.js`)
   ```javascript
   lastBidTime: Date          // Track when last bid was placed
   warningCount: Number       // 0 = no warning, 1 = going once, 2 = going twice, 3 = sold
   isGoingGoingGoneEnabled: Boolean  // Enable/disable per auction
   ```

2. **Timer System** (`backend/controllers/auctionController.js`)
   - `startGoingGoingGoneTimer()` - Initiates the countdown
   - `resetGoingGoingGoneTimer()` - Resets timer on new bids
   - Automatic timer management using `Map` for tracking
   - Socket.io real-time event broadcasting

3. **Socket.io Events**
   - `auction-warning` - Broadcasts warning messages to all users
   - `auction-warning-reset` - Notifies when timer resets

### Frontend Changes

1. **State Management** (`src/pages/Auction.jsx`)
   ```javascript
   const [goingWarning, setGoingWarning] = useState(0);
   const [warningMessage, setWarningMessage] = useState('');
   ```

2. **Socket.io Listeners**
   - Listens for `auction-warning` events
   - Listens for `auction-warning-reset` events
   - Displays toast notifications
   - Updates visual warning banner

3. **Visual Warning Banner**
   - Dynamic colors based on warning level
   - Animated gavel icons that bounce
   - Responsive design for mobile and desktop
   - Pulse animation for urgency

## Testing the System

### 1. Seed Sample Auctions

```bash
cd backend
npm run seed:auctions
```

This creates 5 sample auctions with different start times:
- **Blue Diamond** - Starts in 1 minute (best for immediate testing)
- **Gold Coin Collection** - Starts in 2 minutes
- **Rolex Submariner** - Starts in 5 minutes
- **Persian Rug** - Starts in 10 minutes
- **Roman Denarius Set** - Starts in 15 minutes

### 2. Start Backend Server

```bash
cd backend
npm run dev
```

Make sure Socket.io server is running!

### 3. Start Frontend

```bash
npm run dev
```

### 4. Testing Flow

1. **Wait for Auction to Start**
   - Navigate to the Blue Diamond auction (starts in 1 minute)
   - Wait for status to change from "Upcoming" to "Active"

2. **Place First Bid**
   - Place a bid with sufficient auction coins
   - Timer will start in the backend

3. **Observe First Warning** (30 seconds)
   - After 30 seconds of no bidding:
   - Yellow-orange banner appears: "GOING ONCE! 🔨"
   - Toast notification pops up
   - Console log: "🔨 Auction [ID]: GOING ONCE!"

4. **Observe Second Warning** (60 seconds total)
   - After another 30 seconds:
   - Red-pink banner appears: "GOING TWICE! 🔨🔨"
   - Urgent toast notification
   - Console log: "🔨🔨 Auction [ID]: GOING TWICE!"

5. **Observe Auction Close** (90 seconds total)
   - After another 30 seconds:
   - Green banner appears: "SOLD! 🎉"
   - Success toast notification
   - Auction status changes to "Ended"
   - Winner is determined
   - Console log: "🎉 Auction [ID]: SOLD!"

6. **Test Timer Reset**
   - Repeat steps 2-3
   - Place a new bid during any warning stage
   - Warning banner should disappear
   - Timer resets to 0
   - Full 30-second cycle starts again

## Sample Data Details

| Auction | Starting Price | Reserve Price | Start Time | Duration |
|---------|---------------|---------------|------------|----------|
| Blue Diamond | ₹100,000 | ₹300,000 | +1 min | 25 min |
| Gold Coins | ₹5,000 | ₹15,000 | +2 min | 30 min |
| Rolex | ₹50,000 | ₹150,000 | +5 min | 45 min |
| Persian Rug | ₹25,000 | ₹75,000 | +10 min | 60 min |
| Roman Coins | ₹15,000 | ₹45,000 | +15 min | 75 min |

## Console Output Examples

### Backend Console

```
⏰ Started Going, Going, Gone timer for auction 673abc123def456789
🔨 Auction 673abc123def456789: GOING ONCE!
🔨🔨 Auction 673abc123def456789: GOING TWICE!
🎉 Auction 673abc123def456789: SOLD!
```

### Frontend Console

```
🔔 AUCTION WARNING: { auctionId: '673abc...', message: 'GOING ONCE! 🔨', warning: 1 }
🔔 AUCTION WARNING: { auctionId: '673abc...', message: 'GOING TWICE! 🔨🔨', warning: 2 }
🔔 AUCTION WARNING: { auctionId: '673abc...', message: 'SOLD! 🎉', warning: 3, final: true }
🔄 WARNING RESET: { auctionId: '673abc...', message: 'New bid! Timer reset.' }
```

## Troubleshooting

### Timer Not Starting

1. Check Socket.io connection:
   ```javascript
   // Should see in console:
   ✅ Connected to Socket.io server
   ```

2. Verify auction is Active:
   - Status must be 'Active' not 'Upcoming' or 'Ended'

3. Ensure `isGoingGoingGoneEnabled` is true:
   ```javascript
   console.log(auction.isGoingGoingGoneEnabled); // Should be true
   ```

### Warnings Not Showing

1. Check Socket.io room membership:
   ```javascript
   // Backend should log:
   User joined auction room: auction-[ID]
   ```

2. Verify frontend listener is attached:
   ```javascript
   socketRef.current.on('auction-warning', handleAuctionWarning);
   ```

3. Check for console errors

### Timer Not Resetting

1. Verify bid placement triggers reset:
   ```javascript
   // Backend should log:
   🔄 Reset Going, Going, Gone timer for auction [ID]
   ```

2. Check `lastBidTime` is updating:
   ```javascript
   console.log(auction.lastBidTime); // Should be recent timestamp
   ```

## Configuration

### Change Warning Interval

Edit `backend/controllers/auctionController.js`:

```javascript
const thirtySeconds = 30000; // Change to 60000 for 1 minute intervals
```

### Disable for Specific Auction

Set `isGoingGoingGoneEnabled: false` when creating auction:

```javascript
const auction = new Auction({
  // ... other fields
  isGoingGoingGoneEnabled: false // Timer won't start
});
```

## Benefits

1. **Fair Bidding** - Everyone gets equal opportunity to place final bids
2. **Anti-Snipe** - Prevents last-second bid manipulation
3. **Urgency** - Creates excitement and competitive atmosphere
4. **Traditional Feel** - Mimics real auction house experience
5. **Automatic Closure** - No manual intervention needed

## Future Enhancements

- [ ] Customizable warning intervals per auction
- [ ] Sound effects for warnings
- [ ] Email notifications for warnings
- [ ] SMS alerts for high-value auctions
- [ ] Admin dashboard to monitor active timers
- [ ] Analytics on bidding patterns around warnings

---

**Created with:** Node.js, Express, MongoDB, Socket.io, React
**Author:** Chronicle Vaults Team
**Date:** 2025
