export interface OutlineTemplate {
  id: string
  name: string
  description: string
  text: string
}

export const OUTLINE_TEMPLATES: OutlineTemplate[] = [
  {
    id: 'three-act',
    name: '3 Act Structure',
    description: 'Classic dramatic structure: setup, confrontation, resolution.',
    text: `# Act 1: Setup
## The Ordinary World
Introduce the protagonist and their normal life before the story begins.
## The Inciting Incident
A disruptive event forces the protagonist out of their comfort zone.
## Debate & Choice
The protagonist wrestles with accepting the call to adventure.

# Act 2: Confrontation
## Entering the New World
The protagonist commits to the journey and faces early obstacles.
## Rising Stakes
Complications mount; allies and enemies are established.
## The Midpoint Turn
A major revelation or setback shifts the story's direction.
## Dark Night of the Soul
The protagonist hits their lowest point and must dig deep to continue.

# Act 3: Resolution
## The Climax
The protagonist confronts the central conflict at its peak.
## The Denouement
Loose ends are tied up and the new normal is established.`,
  },
  {
    id: 'save-the-cat',
    name: 'Save the Cat',
    description: "Blake Snyder's 15-beat screenplay structure.",
    text: `# Act 1
## Opening Image
A snapshot of the protagonist's world before the story begins.
## Theme Stated
Someone states the theme — what the story is really about.
## Set-Up
Introduce the protagonist, their flaws, and their world.
## Catalyst
Life-changing event that kicks the story into motion.
## Debate
Should the hero take on the challenge?

# Act 2A
## Break into Two
The protagonist chooses to enter the new world.
## B Story
A secondary story — often a love story — carrying the theme.
## Fun & Games
The promise of the premise; the trailer moments.
## Midpoint
False victory or false defeat — the stakes are raised.
## Bad Guys Close In
The antagonist tightens the grip; internal flaws worsen.

# Act 2B
## All Is Lost
The worst thing possible happens; the protagonist hits rock bottom.
## Dark Night of the Soul
The hero sits with the loss, then discovers the solution.

# Act 3
## Break into Three
The protagonist acts on the new wisdom.
## Finale
The hero proves their transformation by defeating the antagonist.
## Final Image
The opposite of the Opening Image — proof that change happened.`,
  },
  {
    id: 'heros-journey',
    name: "Hero's Journey",
    description: "Joseph Campbell's monomyth, popularized by Christopher Vogler.",
    text: `# Act 1: Departure
## The Ordinary World
The hero is shown in their familiar, comfortable world.
## The Call to Adventure
A challenge or problem presents itself.
## Refusal of the Call
The hero initially hesitates or refuses.
## Meeting the Mentor
The hero meets a wise figure who gives advice or gifts.
## Crossing the First Threshold
The hero commits to the adventure and enters the special world.

# Act 2: Initiation
## Tests, Allies, and Enemies
The hero faces tests, makes allies, and encounters enemies.
## Approach to the Inmost Cave
The hero approaches the central crisis.
## The Ordeal
The hero faces their greatest challenge and experiences a form of death and rebirth.
## The Reward
Having survived, the hero earns the reward they've been seeking.

# Act 3: Return
## The Road Back
The hero must deal with the consequences of their actions.
## The Resurrection
The hero is tested once more — a final, climactic ordeal.
## Return with the Elixir
The hero returns home with the treasure to benefit their world.`,
  },
  {
    id: 'freytag',
    name: "Freytag's Pyramid",
    description: 'Classic five-act dramatic structure developed by Gustav Freytag.',
    text: `# Exposition
## Introduction
Establish the setting, characters, and initial situation.
## Background
Provide backstory and context that the reader needs.

# Rising Action
## First Complication
Introduce the conflict that sets events in motion.
## Building Tension
Each event raises the stakes and creates more complications.
## Point of No Return
The protagonist becomes fully committed; retreat is no longer possible.

# Climax
## The Crisis
The turning point of the story — the moment of highest tension.
## The Revelation
A crucial truth is discovered or a decisive action is taken.

# Falling Action
## Aftermath
The consequences of the climax begin to unfold.
## Unwinding Tension
Conflicts start to resolve, but loose ends remain.

# Denouement
## Resolution
The central conflict is resolved.
## New Equilibrium
A new state of normality is established for the characters.`,
  },
  {
    id: 'story-circle',
    name: "Dan Harmon's Story Circle",
    description: 'An 8-step circular story structure derived from the monomyth.',
    text: `# The Circle
## You (Zone of Comfort)
Establish who the protagonist is and their comfortable world.
## Need (Something They Want)
The protagonist desires something or a problem appears.
## Go (Unfamiliar Situation)
The protagonist leaves their comfort zone to pursue the need.
## Search (Adaptation)
The protagonist struggles to adapt to the unfamiliar situation.
## Find (Get What They Wanted)
The protagonist finds or achieves what they were looking for.
## Take (Pay a Price)
Getting what they wanted comes at a cost.
## Return (Return to Familiar)
The protagonist returns to the familiar situation, changed.
## Change (Having Changed)
The protagonist has grown; the world is slightly different because of it.`,
  },
  {
    id: 'fichtean-curve',
    name: 'Fichtean Curve',
    description: 'Opens in media res with rapid crises building to the climax.',
    text: `# Rising Action (In Media Res)
## Opening Crisis
Start in the middle of the action — immediate tension, no slow setup.
## First Complication
A new obstacle or revelation raises the stakes further.
## Second Complication
Another layer of conflict is added; the protagonist is tested again.
## Third Complication
The situation grows more desperate; everything seems impossible.
## Fourth Complication
The darkest moment before the climax — all hope appears lost.

# Climax
## The Breaking Point
Every thread converges in the most intense scene of the story.

# Falling Action & Resolution
## Immediate Aftermath
The direct consequences of the climax are felt.
## Final Resolution
Loose threads are resolved and the new normal is established.`,
  },
  {
    id: 'derek-murphy-24',
    name: "Derek Murphy's 24 Chapters",
    description: 'A practical 24-chapter outline for commercial fiction.',
    text: `# Act 1: The Setup (Chapters 1–6)
## Chapter 1
Hook the reader; introduce protagonist in a compelling situation.
## Chapter 2
Establish the protagonist's ordinary world and key relationships.
## Chapter 3
Hint at the central conflict; plant seeds of trouble.
## Chapter 4
The inciting incident — everything changes.
## Chapter 5
The protagonist reacts and makes a choice.
## Chapter 6
Commit to the new direction; Act 1 ends.

# Act 2A: Complications (Chapters 7–12)
## Chapter 7
Enter the new world; early wins build false confidence.
## Chapter 8
First major obstacle tests the protagonist.
## Chapter 9
A mentor or ally appears with crucial information.
## Chapter 10
Stakes are raised; secondary conflicts emerge.
## Chapter 11
A partial victory — but at a cost.
## Chapter 12
The midpoint revelation changes everything.

# Act 2B: The Descent (Chapters 13–18)
## Chapter 13
The antagonist's true power is revealed.
## Chapter 14
The protagonist's flaw causes a critical mistake.
## Chapter 15
Allies are lost or threatened.
## Chapter 16
The protagonist tries a new approach.
## Chapter 17
A betrayal or shocking twist.
## Chapter 18
All is lost — the darkest moment.

# Act 3: The Resolution (Chapters 19–24)
## Chapter 19
The protagonist discovers what they truly need.
## Chapter 20
A desperate plan is formed.
## Chapter 21
The plan begins — early success.
## Chapter 22
The climactic confrontation.
## Chapter 23
The aftermath; emotional resolution.
## Chapter 24
The new normal; final image.`,
  },
  {
    id: 'story-clock',
    name: 'Story Clock',
    description: 'A circular 12-point structure emphasizing thematic resonance.',
    text: `# The Clock
## 12 o'Clock — Ordinary World
Establish the protagonist's life before the story begins.
## 1 o'Clock — Problem Emerges
A crack appears in the ordinary world.
## 2 o'Clock — Call to Action
The protagonist is pushed toward change.
## 3 o'Clock — Commitment
The protagonist crosses into the new situation.
## 4 o'Clock — New World
The protagonist navigates unfamiliar territory.
## 5 o'Clock — Complications
Obstacles mount; allies and antagonists are revealed.
## 6 o'Clock — Crisis Point
The midpoint reversal — a false victory or devastating loss.
## 7 o'Clock — Descent
The protagonist's situation worsens; internal conflict peaks.
## 8 o'Clock — Darkest Hour
All seems lost; the protagonist must dig deepest.
## 9 o'Clock — Revelation
A new understanding unlocks the path forward.
## 10 o'Clock — Climax
The protagonist confronts the central conflict at full force.
## 11 o'Clock — Resolution
The conflict resolves; the protagonist is transformed.`,
  },
]
