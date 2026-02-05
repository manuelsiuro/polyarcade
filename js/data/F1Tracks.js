// F1 Circuit Layouts for OneTapRacer
// Each track is defined by control points for a CatmullRomCurve3 spline
// Points designed to match real F1 circuit layouts
// Scale: normalized to fit within ~100 units, Y=0 for all points

export const F1_TRACKS = [
    // ==================== ROW 1 ====================

    // Yas Marina - Double arch at top, wavy bottom
    {
        id: 'yasmarina',
        name: 'Yas Marina',
        country: 'UAE',
        points: [
            // Start/finish straight
            [0, 0, 40], [15, 0, 40],
            // Turn 1-2-3 complex (right side)
            [25, 0, 35], [30, 0, 25], [25, 0, 15],
            // Back section
            [30, 0, 5], [35, 0, -5],
            // Hotel section (top right arch)
            [30, 0, -20], [20, 0, -30], [10, 0, -35],
            // Top connector
            [0, 0, -30], [-10, 0, -35],
            // Marina section (top left arch)
            [-20, 0, -30], [-30, 0, -20],
            // Left side
            [-35, 0, -5], [-30, 0, 10],
            // Chicane section
            [-25, 0, 20], [-20, 0, 25], [-15, 0, 30],
            // Back to start
            [-10, 0, 38]
        ]
    },

    // Las Vegas - Angular street circuit
    {
        id: 'lasvegas',
        name: 'Las Vegas',
        country: 'USA',
        points: [
            // Start on the strip (long straight)
            [0, 0, 45], [0, 0, 20],
            // Sharp left
            [-5, 0, 10], [-15, 0, 5],
            // Kink section
            [-25, 0, 0], [-30, 0, -10],
            // Sharp hairpin
            [-25, 0, -25], [-15, 0, -30],
            // Technical section
            [-5, 0, -25], [5, 0, -30],
            // Right side
            [15, 0, -25], [25, 0, -15],
            // MSG sphere section
            [30, 0, 0], [25, 0, 15],
            // Back to strip
            [15, 0, 30], [10, 0, 40]
        ]
    },

    // Sao Paulo (Interlagos) - Counter-clockwise, S-shape
    {
        id: 'saopaulo',
        name: 'Sao Paulo',
        country: 'Brazil',
        points: [
            // Start/finish
            [30, 0, 25], [35, 0, 15],
            // Senna S (turns 1-2)
            [30, 0, 0], [20, 0, -10], [10, 0, -5],
            // Descida do Lago
            [0, 0, -15], [-10, 0, -25],
            // Ferradura (horseshoe)
            [-25, 0, -30], [-35, 0, -20], [-30, 0, -5],
            // Laranja/Pinheirinho
            [-20, 0, 5], [-25, 0, 15],
            // Bico de Pato
            [-15, 0, 25], [-5, 0, 30],
            // Mergulho/Juncao
            [10, 0, 25], [20, 0, 30]
        ]
    },

    // Mexico City - Stadium section distinctive
    {
        id: 'mexico',
        name: 'Mexico City',
        country: 'Mexico',
        points: [
            // Start/finish straight
            [20, 0, 35], [30, 0, 30],
            // Turn 1
            [35, 0, 20], [30, 0, 10],
            // Esses section
            [20, 0, 5], [25, 0, -5], [20, 0, -15],
            // Peraltada approach
            [10, 0, -25], [0, 0, -30],
            // Stadium section (big curve)
            [-15, 0, -25], [-25, 0, -15], [-30, 0, 0],
            [-25, 0, 15], [-15, 0, 25],
            // Back straight
            [0, 0, 30], [10, 0, 35]
        ]
    },

    // Austin (COTA) - Famous S-curves and technical sections
    {
        id: 'austin',
        name: 'Austin (COTA)',
        country: 'USA',
        points: [
            // Start/finish
            [0, 0, 40],
            // Turn 1 (uphill)
            [10, 0, 30], [5, 0, 20],
            // S-curves (turns 2-3-4-5-6)
            [-5, 0, 15], [5, 0, 5], [-5, 0, -5], [5, 0, -15],
            // Back straight
            [15, 0, -25], [30, 0, -30],
            // Turn 11 hairpin
            [35, 0, -20], [30, 0, -10],
            // Stadium section
            [20, 0, 0], [25, 0, 10],
            // Turns 16-17-18
            [15, 0, 20], [5, 0, 25],
            // Turn 19-20
            [-10, 0, 30], [-15, 0, 35],
            // Back to start
            [-10, 0, 42]
        ]
    },

    // Losail - Flowing desert circuit
    {
        id: 'losail',
        name: 'Losail',
        country: 'Qatar',
        points: [
            // Main straight
            [0, 0, 35], [15, 0, 30],
            // Turn 1-2-3
            [25, 0, 20], [30, 0, 5], [25, 0, -10],
            // Back section
            [15, 0, -20], [20, 0, -30],
            // Flowing corners
            [10, 0, -40], [-5, 0, -35],
            // Left side
            [-20, 0, -25], [-30, 0, -10],
            // Final sector
            [-25, 0, 5], [-20, 0, 20],
            // Back to start
            [-10, 0, 30]
        ]
    },

    // Suzuka - Figure-8 shape
    {
        id: 'suzuka',
        name: 'Suzuka',
        country: 'Japan',
        points: [
            // Start/finish
            [25, 0, 35],
            // Turn 1-2 (first curves)
            [35, 0, 25], [30, 0, 10],
            // S-curves (Esses)
            [20, 0, 5], [25, 0, -5], [15, 0, -10], [20, 0, -20],
            // Dunlop curve
            [10, 0, -30], [-5, 0, -35],
            // Degner curves
            [-15, 0, -25], [-10, 0, -15],
            // Hairpin
            [-20, 0, -5], [-25, 0, 5],
            // Spoon curve
            [-30, 0, 15], [-25, 0, 25],
            // 130R
            [-15, 0, 30], [-5, 0, 35],
            // Casio Triangle / Chicane
            [5, 0, 30], [15, 0, 35]
        ]
    },

    // Singapore - Angular street circuit
    {
        id: 'singapore',
        name: 'Singapore',
        country: 'Singapore',
        points: [
            // Start/finish
            [0, 0, 35], [15, 0, 35],
            // Turn 1-2-3
            [25, 0, 30], [30, 0, 20], [25, 0, 10],
            // Turn 5 hairpin
            [30, 0, 0], [25, 0, -10],
            // Singapore Sling area
            [15, 0, -15], [20, 0, -25],
            // Turns 10-11-12
            [10, 0, -35], [-5, 0, -30],
            // Anderson Bridge
            [-15, 0, -20], [-25, 0, -15],
            // Esplanade
            [-30, 0, 0], [-25, 0, 15],
            // Turn 19-20-21
            [-20, 0, 25], [-10, 0, 30]
        ]
    },

    // ==================== ROW 2 ====================

    // Monza - Temple of Speed, simple layout
    {
        id: 'monza',
        name: 'Monza',
        country: 'Italy',
        points: [
            // Start/finish (main straight)
            [0, 0, 40], [25, 0, 35],
            // Prima Variante (chicane)
            [30, 0, 25], [25, 0, 15],
            // Curva Grande
            [30, 0, 0], [25, 0, -15],
            // Seconda Variante
            [20, 0, -25], [10, 0, -30],
            // Ascari chicane
            [-5, 0, -25], [-15, 0, -30], [-25, 0, -20],
            // Parabolica
            [-30, 0, -5], [-25, 0, 15],
            // Back to start
            [-15, 0, 30], [-5, 0, 38]
        ]
    },

    // Zandvoort - Banked corners, flowing
    {
        id: 'zandvoort',
        name: 'Zandvoort',
        country: 'Netherlands',
        points: [
            // Start/finish
            [0, 0, 30], [15, 0, 28],
            // Tarzan (Turn 1)
            [25, 0, 20], [20, 0, 10],
            // Gerlachbocht
            [25, 0, 0], [20, 0, -10],
            // Hugenholtz
            [10, 0, -20], [0, 0, -25],
            // Back section
            [-15, 0, -20], [-25, 0, -10],
            // Scheivlak
            [-30, 0, 5], [-25, 0, 15],
            // Final banked turn
            [-15, 0, 25], [-5, 0, 28]
        ]
    },

    // Spa-Francorchamps - Eau Rouge distinctive
    {
        id: 'spa',
        name: 'Spa-Francorchamps',
        country: 'Belgium',
        points: [
            // Start/finish (La Source approach)
            [0, 0, 30],
            // La Source hairpin
            [10, 0, 35], [15, 0, 25],
            // Eau Rouge / Raidillon (steep climb)
            [10, 0, 10], [15, 0, -5],
            // Kemmel straight
            [25, 0, -20], [30, 0, -30],
            // Les Combes
            [20, 0, -40], [5, 0, -35],
            // Malmedy / Rivage
            [-10, 0, -40], [-20, 0, -30],
            // Pouhon
            [-30, 0, -15], [-25, 0, 0],
            // Fagnes / Stavelot
            [-35, 0, 10], [-25, 0, 20],
            // Blanchimont
            [-15, 0, 25], [-5, 0, 28]
        ]
    },

    // Budapest (Hungaroring) - Tight and twisty
    {
        id: 'budapest',
        name: 'Budapest',
        country: 'Hungary',
        points: [
            // Start/finish
            [0, 0, 35], [15, 0, 32],
            // Turn 1-2
            [25, 0, 25], [20, 0, 15],
            // Turn 3-4
            [25, 0, 5], [15, 0, -5],
            // Turn 5-6
            [20, 0, -15], [10, 0, -25],
            // Turn 7-8
            [0, 0, -30], [-15, 0, -25],
            // Turn 9-10-11
            [-25, 0, -15], [-20, 0, 0],
            // Turn 12-13
            [-25, 0, 15], [-15, 0, 25],
            // Turn 14
            [-5, 0, 30]
        ]
    },

    // Spielberg (Red Bull Ring) - Short, simple
    {
        id: 'spielberg',
        name: 'Spielberg',
        country: 'Austria',
        points: [
            // Start/finish (going uphill)
            [0, 0, 25], [10, 0, 20],
            // Turn 1-2 (steep uphill right)
            [20, 0, 10], [15, 0, -5],
            // Turn 3 (Remus)
            [20, 0, -20], [10, 0, -30],
            // Turn 4 (Schlossgold)
            [-5, 0, -25], [-15, 0, -20],
            // Rindt (right)
            [-20, 0, -5], [-15, 0, 10],
            // Final turns
            [-10, 0, 20], [-5, 0, 25]
        ]
    },

    // Silverstone - Complex with Maggots-Becketts
    {
        id: 'silverstone',
        name: 'Silverstone',
        country: 'UK',
        points: [
            // Start/finish (Wellington straight)
            [-10, 0, 40],
            // Copse
            [5, 0, 35], [15, 0, 25],
            // Maggots-Becketts-Chapel complex
            [10, 0, 15], [20, 0, 5], [15, 0, -5], [25, 0, -15],
            // Hangar straight
            [35, 0, -25], [30, 0, -35],
            // Stowe
            [20, 0, -40], [5, 0, -35],
            // Vale / Club
            [-10, 0, -40], [-20, 0, -30],
            // Abbey
            [-30, 0, -20], [-25, 0, -5],
            // Farm / Village
            [-30, 0, 10], [-20, 0, 20],
            // The Loop / Aintree
            [-25, 0, 30], [-15, 0, 38]
        ]
    },

    // Montreal - Hairpin distinctive
    {
        id: 'montreal',
        name: 'Montreal',
        country: 'Canada',
        points: [
            // Start/finish
            [0, 0, 35], [15, 0, 33],
            // Turn 1-2 (chicane)
            [25, 0, 25], [20, 0, 15],
            // Turn 3-4
            [25, 0, 5], [30, 0, -10],
            // Turn 5
            [25, 0, -20], [15, 0, -25],
            // Hairpin (Turn 6)
            [5, 0, -20], [0, 0, -30], [-10, 0, -25],
            // Casino straight
            [-20, 0, -30], [-30, 0, -20],
            // Final chicane
            [-25, 0, -5], [-30, 0, 10],
            // Wall of Champions area
            [-20, 0, 25], [-10, 0, 32]
        ]
    },

    // Barcelona - Technical with long corners
    {
        id: 'barcelona',
        name: 'Barcelona',
        country: 'Spain',
        points: [
            // Start/finish
            [-5, 0, 35], [10, 0, 32],
            // Turn 1-2 (Elf)
            [20, 0, 25], [25, 0, 10],
            // Turn 3-4-5 (Renault/Repsol)
            [20, 0, 0], [25, 0, -15], [15, 0, -25],
            // Turn 6-7-8
            [5, 0, -20], [10, 0, -30], [0, 0, -40],
            // Turn 9 (Campsa)
            [-15, 0, -35], [-25, 0, -25],
            // Turn 10 (La Caixa)
            [-30, 0, -10], [-25, 0, 5],
            // Turn 12-13-14-15
            [-30, 0, 15], [-20, 0, 25],
            // Turn 16 (New chicane)
            [-10, 0, 30]
        ]
    },

    // ==================== ROW 3 ====================

    // Monaco - Iconic street circuit
    {
        id: 'monaco',
        name: 'Monaco',
        country: 'Monaco',
        points: [
            // Start/finish
            [15, 0, 40],
            // Sainte Devote
            [25, 0, 35], [30, 0, 20],
            // Casino / Massenet (climbing)
            [25, 0, 5], [20, 0, -10],
            // Casino Square
            [25, 0, -20], [15, 0, -25],
            // Mirabeau
            [5, 0, -20], [0, 0, -30],
            // Hairpin (Loews)
            [-10, 0, -25], [-15, 0, -15],
            // Portier
            [-10, 0, -5], [-5, 0, 5],
            // Tunnel
            [5, 0, 10], [10, 0, 20],
            // Nouvelle Chicane
            [5, 0, 25], [-5, 0, 30],
            // Tabac / Swimming Pool
            [-15, 0, 25], [-20, 0, 15],
            // Rascasse
            [-15, 0, 30], [-5, 0, 38]
        ]
    },

    // Imola - Old school character
    {
        id: 'imola',
        name: 'Imola',
        country: 'Italy',
        points: [
            // Start/finish
            [0, 0, 30], [15, 0, 28],
            // Tamburello (fast left)
            [25, 0, 20], [20, 0, 5],
            // Villeneuve chicane
            [25, 0, -10], [15, 0, -15],
            // Tosa
            [20, 0, -25], [10, 0, -35],
            // Piratella
            [-5, 0, -30], [-15, 0, -35],
            // Acque Minerali
            [-25, 0, -25], [-20, 0, -10],
            // Variante Alta
            [-25, 0, 5], [-15, 0, 15],
            // Rivazza
            [-20, 0, 25], [-10, 0, 30]
        ]
    },

    // Miami - Modern street circuit
    {
        id: 'miami',
        name: 'Miami',
        country: 'USA',
        points: [
            // Start/finish
            [0, 0, 35], [15, 0, 32],
            // Turn 1-2-3
            [25, 0, 25], [30, 0, 10], [25, 0, -5],
            // Turn 4-5-6 (technical)
            [30, 0, -15], [20, 0, -25], [10, 0, -20],
            // Turn 7-8
            [15, 0, -30], [5, 0, -40],
            // Beach chicane area
            [-10, 0, -35], [-20, 0, -25],
            // Turn 11-12-13
            [-30, 0, -15], [-25, 0, 0],
            // Turn 14-15-16
            [-30, 0, 15], [-20, 0, 25],
            // Final corners
            [-10, 0, 32]
        ]
    },

    // Baku - Long and narrow street circuit
    {
        id: 'baku',
        name: 'Baku',
        country: 'Azerbaijan',
        points: [
            // Start/finish (fast straight)
            [0, 0, 50], [5, 0, 35],
            // Turn 1-2
            [15, 0, 25], [10, 0, 15],
            // Turn 3-4-5
            [20, 0, 5], [15, 0, -10], [20, 0, -20],
            // Castle section (tight)
            [10, 0, -30], [5, 0, -40],
            // Turn 8-9-10
            [-5, 0, -45], [-15, 0, -35],
            // Old city (very tight)
            [-10, 0, -25], [-20, 0, -15],
            // Turn 15-16
            [-15, 0, 0], [-20, 0, 15],
            // Turn 17-18-19
            [-10, 0, 25], [-5, 0, 40]
        ]
    },

    // Shanghai - Snail shell turns 1-2-3
    {
        id: 'shanghai',
        name: 'Shanghai',
        country: 'China',
        points: [
            // Start/finish
            [0, 0, 35], [15, 0, 30],
            // Turn 1-2-3 (snail shell) - distinctive!
            [25, 0, 20], [20, 0, 10], [30, 0, 5], [25, 0, -5], [15, 0, 0],
            // Turn 4-5-6
            [10, 0, -15], [20, 0, -25],
            // Back straight
            [30, 0, -35], [20, 0, -45],
            // Turn 11-12-13
            [5, 0, -40], [-10, 0, -35],
            // Turn 14-15-16
            [-25, 0, -25], [-30, 0, -10],
            // Final corners
            [-25, 0, 10], [-15, 0, 25],
            // Back to start
            [-5, 0, 32]
        ]
    },

    // Melbourne (Albert Park) - Fast street/park circuit
    {
        id: 'melbourne',
        name: 'Melbourne',
        country: 'Australia',
        points: [
            // Start/finish
            [0, 0, 35], [15, 0, 30],
            // Turn 1-2
            [25, 0, 20], [20, 0, 5],
            // Turn 3 (fast)
            [25, 0, -10], [20, 0, -25],
            // Turn 4-5-6
            [10, 0, -30], [-5, 0, -35], [-15, 0, -25],
            // Turn 7-8 (lakeside)
            [-10, 0, -15], [-20, 0, -5],
            // Turn 9-10
            [-25, 0, 10], [-15, 0, 20],
            // Turn 11-12
            [-20, 0, 30], [-10, 0, 35]
        ]
    },

    // Jeddah - High speed street circuit
    {
        id: 'jeddah',
        name: 'Jeddah',
        country: 'Saudi Arabia',
        points: [
            // Start/finish
            [0, 0, 50], [10, 0, 40],
            // Turn 1-2-3 (fast)
            [20, 0, 30], [15, 0, 15], [25, 0, 5],
            // Turn 4-5-6
            [20, 0, -10], [25, 0, -25], [15, 0, -35],
            // Turn 7-8-9
            [20, 0, -45], [10, 0, -50], [-5, 0, -45],
            // Turn 10-11-12
            [-15, 0, -35], [-10, 0, -20], [-20, 0, -10],
            // Turn 13-14-15
            [-25, 0, 5], [-15, 0, 15],
            // Turn 16-17 (tight section)
            [-20, 0, 30], [-10, 0, 40],
            // Back to start
            [-5, 0, 48]
        ]
    },

    // Bahrain - Desert circuit
    {
        id: 'bahrain',
        name: 'Bahrain',
        country: 'Bahrain',
        points: [
            // Start/finish
            [25, 0, 40],
            // Turn 1 (deep braking)
            [35, 0, 30], [30, 0, 20],
            // Turn 2-3
            [35, 0, 10], [30, 0, -5],
            // Turn 4 (fast)
            [35, 0, -20], [25, 0, -30],
            // Turn 5-6-7
            [10, 0, -35], [0, 0, -25], [-10, 0, -30],
            // Turn 8-9-10 (arena section)
            [-20, 0, -20], [-15, 0, -5], [-25, 0, 5],
            // Turn 11-12-13
            [-20, 0, 20], [-10, 0, 25],
            // Turn 14-15 (final corners)
            [0, 0, 35], [15, 0, 40]
        ]
    }
];

// Track display order for menu (organized by row as specified in plan)
export const TRACK_DISPLAY_ORDER = [
    // Row 1
    'yasmarina', 'lasvegas', 'saopaulo', 'mexico', 'austin', 'losail', 'suzuka', 'singapore',
    // Row 2
    'monza', 'zandvoort', 'spa', 'budapest', 'spielberg', 'silverstone', 'montreal', 'barcelona',
    // Row 3
    'monaco', 'imola', 'miami', 'baku', 'shanghai', 'melbourne', 'jeddah', 'bahrain'
];

// Get tracks in display order
export function getTracksInOrder() {
    return TRACK_DISPLAY_ORDER.map(id => F1_TRACKS.find(t => t.id === id));
}
