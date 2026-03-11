Aokey — Tianao's Works
A personal portfolio website featuring mini-games.
## Design Process
This is a personal work showcase website. The website and the embedded browser game were designed simultaneously - the page layout and the game world are the same.
The main idea is to make the web page interactive. 
Elements such as navigation links, card borders and buttons will automatically become platforms that players can jump onto.
The design of the flower collection system is intended to make people feel like they have achieved something.
Flowers will automatically appear on the platform, and every time 10 flowers are collected, they will merge into one large flower in the HUD.  

PROJECT/
├── index.html           # Main page
├── styles.css           # Global styles
├── script.js            # Game logic
├── works.js             # Project data
├── site.webmanifest     # Favicon config
├── about/
│   └── index.html       # About page
└── images/
    ├── 人物.png            # Player character (idle)
    ├── fly-1.png           # Player character (fly frame 1)
    ├── fly-2.png           # Player character (fly frame 2)
    ├── drag-1.png          # Player character (dragging)
    ├── 花.png              # Collectible flower
    ├── navigation.png      # Nav current page indicator
    ├── cursor.png          # Custom cursor
    └── cursor-button.png   # Hover cursor
    
## Gameplay

Click the **▶ PLAY** button at the bottom of the sidebar to start.

| Key | Action |
|-----|--------|
| `← →` or `A D` | Move left / right |
| `↑` or `W` or `Space` | Jump |
| `Space` | Fly |
| `↓` or `S` | Drop through platform |
| Mouse drag | Drag character directly |

Click the **🌷** button to drop flowers from above. 
Collected flowers appear in the top-right corner — **every 10 flowers merge into one big flower**.

The following page elements automatically become platforms:
- Title underline
- Sidebar navigation links
- Project card top / bottom edges
- PLAY button

## AI Usage Instructions
With the assistance of Claude Code AI, all the decision-making designs were independently decided by myself.
