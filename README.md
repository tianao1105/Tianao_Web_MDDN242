# Aokey — Tianao's Works
A personal portfolio website featuring mini-games.
## Influences & Inspiration

- Classic 2D platformer games — general inspiration for the in-page game mechanic
- RPG merchant/shop systems — model for the item purchase and coin economy
- Minimalist portfolio design aesthetic — keeping the layout clean and content-focused

## Design Journal

The starting point for this project was a simple question: what if visiting a portfolio felt like playing a game? Most portfolio websites are static. You scroll, you look, you leave. I wanted something that rewarded curiosity. The idea of embedding a platformer game directly into the page came early, and it shaped almost every design decision that followed.

The core concept was to treat the page itself as a game world. Rather than building a separate game screen, the website's own elements (navigation links, card borders, the PLAY button, the title underline) all become platforms the player can jump on. This meant the layout and the game had to be designed together. Moving a card or adjusting a nav link would change the level. It made the design process feel more like building a world than building a webpage.

A lot of the features that ended up in the final site were not planned from the beginning. Many ideas came from simply sitting with the page and observing, noticing a gap that could become a platform, or a button that felt like it should do something more. The shop system grew out of that kind of exploration. I have always been fond of the store purchase interface in games, so I designed this purchase background element. Coins collected through gameplay could be spent in a shop to unlock visual effects that change how the whole site looks and feels: rain, grass growing on the navigation bar, a repeating coffee grid background. Each item does something slightly absurd, which felt right for a creative portfolio.

The visual style of the entire game remains simple. A clean layout with a restrained colour palette keeps the focus on the work itself. The game elements are layered on top without overwhelming the content. The character is small, the effects are subtle until you choose to activate them. This balance between calm and playful is something I kept returning to throughout the process.(If you want to change the color, then you can also choose the color you like.)

Photography became its own section during development, a separate space from the design projects. Adding it felt natural, same grid layout, same popup interaction, but with a different tone. Where the project cards show made things, the photo grid shows seen things.

Finally, I added three mini-games to make the process of obtaining gold coins less boring. More uses for the gold coins will be added later.

Looking back, the most interesting part of this process was how the constraints of a real webpage (fixed navigation, scroll behaviour, DOM elements with actual positions) became creative material rather than limitations. The game had to work within the page, not despite it.


## Picture Material
I used Pixel Studio to create all the necessary element images for my website.
All the other pictures are my own creations.

## Project Structure

```
├── index.html              # Home page
├── shop.html               # Shop page
├── photography.html        # Photography page
├── game.html               # Games page (mini-game arcade)
├── about/
│   └── index.html          # About page
├── styles.css              # Global styles
├── script.js               # Game engine
├── shopEffects.js          # Shop item effects (runs on all pages)
├── colorWheel.js           # Background colour picker (runs on all pages)
├── coinHud.js              # Coin HUD (runs on all pages)
├── works.js                # Home project data
├── photography_works.js    # Photography page data
├── images/
│   ├── 人物.png             # Player character (idle)
│   ├── fly-1.png           # Player character (fly frame 1)
│   ├── fly-2.png           # Player character (fly frame 2)
│   ├── drag-1.png          # Player character (dragging)
│   ├── coin_gif.gif        # Collectible coin
│   ├── insert_coins.gif    # Coin spawn button
│   ├── shop_market.gif     # Shop market building
│   ├── Showcase.png        # Shop showcase unit
│   ├── item_1.png          # Shop item: Mysterious Water
│   ├── item_2.png          # Shop item: Invisible Grass
│   ├── item_3.png          # Shop item: Cat Cat Coffee
│   ├── image1.png          # Portfolio project 1
│   ├── image2.png          # Portfolio project 2
│   ├── image3.png          # Portfolio project 3
│   └── 1.png               # That's ME.
└── photo/
    ├── photo_1.jpg         # Photography 1
    ├── ...
    └── photo_9.jpg         # Photography 9
```

## Gameplay

Click **▶ PLAY** in the sidebar to start.

| Key | Action |
|-----|--------|
| `← →` or `A D` | Move left / right |
| `↑` or `W` | Jump |
| `Space` (in air) | Fly |
| `↓` or `S` | Drop through platform |
| Mouse drag | Drag character directly |

Hold the coin button to drop coins from above — collect them by walking into them. Coin count is saved across pages.

Visit the **Shop** page to spend coins on items that change how the site looks and feels.

Visit the **Games** page to play three mini-games: **AoFly** (Flappy Bird-style), **Coin Snake**, and **Slots**. Walk the character onto a game card and press **E** to launch it, or click the card directly. Coins earned in mini-games are added to your total.

Page elements that become platforms:
- Title underline
- Sidebar navigation links
- Project card edges (home page & games page)
- PLAY button

### Proximity hints

Walking the character into certain elements triggers contextual speech bubbles:

| Element | Message |
|---------|---------|
| Home nav link | *"Welcome back!"* |
| Photography nav link | *"Come see what I found~"* |
| Shop nav link | *"Why is the background so plain? Come take a look!"* |
| Games nav link | *"I want to play this!"* |
| About nav link | *"Wow, that's me!"* |
| Color wheel | *"Pick your favorite color~"* |
| Home project cards | Project description |
| Game cards | Game name + `[E] Play` |

On the **Games** page, pressing **E** while standing on a game card launches that game directly.

## AI Collaboration

I used Claude Code to help write and implement code throughout this project. All ideas and design decisions were my own — the AI translated them into working code.

I would describe what I wanted, and Claude would implement it. Without this, many technical features (the platformer physics, localStorage persistence, the shop proximity system) would have been beyond my current coding ability. AI made it possible to build what I could imagine but not yet write.
