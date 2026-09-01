/**
 * The diary.
 *
 * Same Walk is fiction. The route, the town, the scrapyard, the heron and every
 * word of these notes were written for this piece; nothing here is a record of
 * anybody's actual mornings. That is stated in the colophon on the page as well
 * as here, because a diary that let a reader assume it was real would be
 * dishonest in a way a diary cannot afford to be.
 *
 * Form: she kept the notes on her phone as she walked, one per thing seen,
 * tagged with where on the route she was. So a morning is not one paragraph but
 * one to five short notes pinned to nine fixed places. That is what makes the
 * route navigable as an axis — every note sits at the crossing of a place and a
 * date, and can be left along either.
 *
 * A year: 2 October 2023 to 30 September 2024.
 */
import type { StationId } from "./route-data";

export type Note = {
  /** Where on the route. */
  at: StationId;
  text: string;
};

export type DiaryDay = {
  /** ISO date, treated as UTC everywhere so weekdays never shift. */
  date: string;
  notes: Note[];
};

type NoteTuple = [StationId, string];

function day(date: string, ...notes: NoteTuple[]): DiaryDay {
  return { date, notes: notes.map(([at, text]) => ({ at, text })) };
}

export const DIARY: DiaryDay[] = [
  // ── October ───────────────────────────────────────────────────────────────
  day(
    "2023-10-02",
    ["step", "First morning. Quarter to seven. Cold enough for a coat and I didn't take one, so that's one thing learned."],
    ["towpath", "The water is whatever colour the sky is, and today the sky is nothing much."],
    ["pool", "A heron on the far side, facing away from me. It didn't move once in the time I stood there, and I stood there too long."],
    ["back", "Twenty-two minutes. It's supposed to be twenty."],
  ),
  day(
    "2023-10-03",
    ["step", "Coat."],
    ["bridge41", "Somebody has been sleeping under the bridge. Cardboard, flattened, dry. Not last night, though — it's been dry a week."],
    ["pool", "No heron. I looked for longer than makes any sense."],
  ),
  day(
    "2023-10-05",
    ["ginnel", "Blackberries going over on the wall at the top of the ginnel. Too high to reach without looking like an idiot at ten to seven."],
    ["iron", "06:52 on time. Two carriages, four people, all of them on their phones."],
    ["veritys", "The magnet was working. It picks up a car door and drops it and the whole yard rings like a bell for about four seconds after."],
  ),
  day(
    "2023-10-06",
    ["step", "Rain that isn't quite rain."],
    ["footbridge", "There's a bolt missing from the handrail. Third step up, right hand side. I put my thumb in the hole every morning without ever deciding to."],
  ),
  day(
    "2023-10-09",
    ["towpath", "Leaves came down over the weekend, all at once. The towpath is more brown than grey now."],
    ["veritys", "The dog barked at me. Grey, long-legged, some sort of lurcher, chained to a hook by the office door with about four feet of slack. I don't know his name so Grey will do."],
    ["pool", "Heron. Same spot as the first morning, facing the same way."],
  ),
  day(
    "2023-10-11",
    ["step", "Dark at quarter to seven for the first time. Not black, but not morning either."],
    ["iron", "A man coming the other way with a radio in his coat pocket. Talk, not music, and turned up too loud for a pocket. We both did the nod."],
    ["back", "Twenty minutes exactly. First time."],
  ),
  day(
    "2023-10-12",
    ["towpath", "Mist sitting on the water about a foot deep, so the ducks had no legs."],
    ["pool", "No heron. Something black and low went over towards the lock and I don't know enough about birds to say what."],
  ),
  day(
    "2023-10-16",
    ["step", "Frost on the wheelie bins and not on the pavement, which I don't understand."],
    ["bridge41", "The bridge drips even when it hasn't rained. Where does it get it from."],
    ["veritys", "Grey didn't bark. Just watched me go past with his chin flat on the concrete."],
  ),
  day(
    "2023-10-18",
    ["ginnel", "Someone has put the bike frame in the bin at last — the green one, no wheels, that's been leaning on the wall since we moved in. I minded more than I expected to."],
    ["iron", "06:52 late. Went over at 06:56 when I was already at the yard, so I heard it instead of seeing it."],
  ),
  day(
    "2023-10-19",
    ["pool", "Heron in the reeds this time, not out on the mud. I only found him because he moved his head about an inch."],
    ["footbridge", "Eleven steps up. I counted them today for the first time, which means I've gone up them fifteen-odd times without counting."],
  ),
  day(
    "2023-10-23",
    ["step", "Wind. The recycling had got all the way down to number 12 in the night."],
    ["towpath", "Cut's full to the brim after the weekend. An inch off the path in places, and it makes the whole thing look heavier than it is."],
    ["back", "Rain on the way home, so I did the last bit at a jog and felt about ninety."],
  ),
  day(
    "2023-10-25",
    ["iron", "Radio man again, same place, near enough the same minute. Racing, I think. Something with a lot of names in it."],
    ["veritys", "A washing machine on top of the pile, door open, drum filling up with rain. Third day it's been there."],
    ["pool", "Heron. Four out of ten so far, which is not sometimes and not usually either."],
  ),
  day(
    "2023-10-27",
    ["ginnel", "Kids have chalked a grid on the ginnel floor. Not hopscotch — some game with letters in it that I don't know."],
    ["footbridge", "Stood at the top for a bit for no reason. You can see all the way back to bridge 41 from up there, which I hadn't realised: the whole first half of the walk in one look."],
  ),
  day(
    "2023-10-30",
    ["step", "Clocks went back so it's light again, which is a con and everybody knows it."],
    ["towpath", "Sycamore leaves lying flat on the water like they'd been put there."],
    ["veritys", "Crane wasn't running. Verity himself, or a Verity, in the office doorway with a mug, and Grey sat up against his leg."],
  ),
  day(
    "2023-10-31",
    ["step", "Proper cold this morning, the sort that gets your teeth."],
    ["back", "Nothing happened. Writing that down anyway, because a morning where nothing happens is most of them."],
  ),

  // ── November ──────────────────────────────────────────────────────────────
  day(
    "2023-11-02",
    ["step", "Head torch. I feel a fool in it and I'm not going to stop wearing it."],
    ["bridge41", "A torch under the bridge shows you what your eyes have been letting you off. It is filthy under there."],
    ["pool", "Heron. The torch caught his eye and it went orange for a second, like a cat's. I turned it off and apologised out loud, to a bird."],
  ),
  day(
    "2023-11-03",
    ["iron", "06:52 lit up from inside going over. From underneath you get nine yellow windows and then nothing."],
    ["veritys", "Yard lights on, sodium, and the magnet swinging with nothing on it."],
  ),
  day(
    "2023-11-06",
    ["towpath", "Rain all weekend and the cut has gone the colour of tea."],
    ["footbridge", "Wet steps. Held the rail, which I don't usually. Thumb in the bolt hole."],
  ),
  day(
    "2023-11-08",
    ["towpath", "There's a mattress in the cut. Single, floral, one corner up out of the water like a fin. Thirty yards short of bridge 41."],
    ["veritys", "Somebody has put a coat on the dog. Tartan."],
  ),
  day(
    "2023-11-10",
    ["step", "First frost that stuck. Whole street white, every windscreen scraped in a hurry except ours."],
    ["bridge41", "The mattress has moved twenty yards down and it's going to end up under the bridge, and then it'll be under the bridge for good."],
    ["pool", "No heron. Ice at the edge of the pool, a skin of it, reeds sticking up through."],
  ),
  day(
    "2023-11-13",
    ["iron", "Radio man had gloves on and the radio was still going. Weather warnings. He said nothing, as usual, and I've decided I like that about him."],
    ["pool", "Heron stood on the ice, right at the edge where it's thin. He knows something about how thick it is that I don't."],
  ),
  day(
    "2023-11-14",
    ["footbridge", "A woman in a red coat crying on the footbridge. Not making any noise about it, just stood at the rail with her face going. I said morning because I couldn't think what else to do and she said morning back, perfectly normal, and I kept walking. I've thought about it all day and I still don't know whether I should have stopped."],
    ["back", "Twenty-six minutes. I went slowly on purpose in case she came the other way, and she didn't."],
  ),
  day(
    "2023-11-16",
    ["step", "Dark and wet, the two together."],
    ["veritys", "Nobody in. The magnet was parked down on the pile like it had given up."],
  ),
  day(
    "2023-11-20",
    ["ginnel", "Frost in the ginnel lasts three days longer than frost anywhere else, because the sun never gets down there."],
    ["towpath", "Someone has pulled the mattress out and left it on the towpath, which is not better."],
  ),
  day(
    "2023-11-22",
    ["bridge41", "Four strides through and out. I've got it down to four; it used to be five."],
    ["pool", "Heron. Nine so far this month."],
    ["back", "The backs of the houses are all lit up at this time of year and you can see straight into the kitchens. I don't look. I look."],
  ),
  day(
    "2023-11-24",
    ["iron", "No 06:52 at all. Nothing went over, and it made the whole walk feel wrong, like a clock that's stopped."],
    ["veritys", "Grey barked twice and then wagged, which is a new combination."],
  ),
  day(
    "2023-11-27",
    ["step", "Snow that didn't settle. Wet lines of it going past the lamp."],
    ["towpath", "Mattress is back in the water. Either it went in by itself or somebody put it in, and I'd rather not know which."],
    ["footbridge", "You can see all your breath in the torch beam going up the steps, like you're smoking."],
  ),
  day(
    "2023-11-29",
    ["pool", "Heron facing the other way for once, towards the lock. Same bird, I assume. Nobody can tell me it isn't."],
    ["back", "Michael rang about Christmas while I was on the far bank. I let it go to voicemail, then felt bad and rang him back from the step."],
  ),

  // ── December ──────────────────────────────────────────────────────────────
  day(
    "2023-12-01",
    ["step", "December. The street smells of other people's central heating."],
    ["pool", "Heron. First of the month, so he's clocked on as well."],
  ),
  day(
    "2023-12-04",
    ["towpath", "Ice right across the cut for the first time, thin, and it holds the leaves where they fell instead of taking them away. The whole surface has stopped."],
    ["veritys", "Grey lying on a folded blanket that wasn't there on Friday. Somebody in that office is soft."],
    ["footbridge", "Steps gritted. Somebody comes and grits them and I have never once seen who."],
  ),
  day(
    "2023-12-06",
    ["step", "Minus two on the car. Torch, gloves, the lot."],
    ["bridge41", "Icicles under the bridge, six or seven of them, the longest about a foot. So that's where the drips go in December."],
    ["pool", "No heron. Pool frozen hard enough that a gull was standing in the middle of it looking daft."],
  ),
  day(
    "2023-12-08",
    ["iron", "Radio man's radio was off. First time. It made the nod feel like more than it was."],
    ["towpath", "Mattress frozen into the ice at an angle. It looks like it's sinking and it isn't going anywhere."],
  ),
  day(
    "2023-12-11",
    ["ginnel", "Christmas lights on in the back window at 41 at seven in the morning, blinking away at nobody."],
    ["veritys", "Yard shut. Gates chained. No crane, no magnet, nobody in the office."],
    ["back", "Without the yard going, you can hear the water. I have walked past that fence sixty times and never once heard the water."],
  ),
  day(
    "2023-12-13",
    ["step", "Rain, and warm with it. All the ice gone overnight like it never happened."],
    ["pool", "Heron back, stood in the shallows where the ice was."],
  ),
  day(
    "2023-12-15",
    ["towpath", "Cut running high and brown and quick. Mattress has moved again — under bridge 41 at last, wedged up against the far wall."],
    ["bridge41", "Four strides, and I looked at it for all four."],
  ),
  day(
    "2023-12-18",
    ["iron", "06:52 packed for once. Everybody going somewhere for Christmas at the same time, apparently."],
    ["footbridge", "Thumb in the bolt hole. Somebody ought to fix that and I'd be sorry if they did."],
  ),
  day(
    "2023-12-20",
    ["step", "Shortest week of the year and it isn't properly light even by the time I get back."],
    ["veritys", "Still shut. Grey's hook has nothing on it and I don't like it."],
  ),
  day(
    "2023-12-22",
    ["pool", "Heron on the lock beam, which is new. Higher up than he goes, looking down into the chamber where the water's still."],
    ["back", "Michael's coming Boxing Day and Dad's coming with him, which he won't like, but he's not driving that far on his own and that's that."],
  ),
  day(
    "2023-12-27",
    ["step", "First morning out since the 22nd. House full, nobody up, and I have never been so glad of a wet street."],
    ["towpath", "Dad got as far as bridge 41 yesterday afternoon and had to stop. He said the light down here was worth it, which is not the sort of thing he says."],
    ["back", "Twenty-eight minutes. Went slow on purpose."],
  ),
  day(
    "2023-12-29",
    ["iron", "Radio back on. Something about the year in review. He'd have been better off with the racing."],
    ["veritys", "Gates still chained but there's a light on in the office and Grey's out on his hook, so somebody's in."],
  ),
  day(
    "2023-12-31",
    ["step", "Mild and grey. It has been mild and grey since the 13th."],
    ["pool", "No heron on the last morning of the year, which I am choosing not to read anything into."],
  ),

  // ── January ───────────────────────────────────────────────────────────────
  day(
    "2024-01-02",
    ["step", "Back to it. Torch batteries dead, so I walked it by streetlight and phone."],
    ["towpath", "The cut in the dark is a hole where the reflections are. You take it on trust that it's water."],
  ),
  day(
    "2024-01-03",
    ["veritys", "Yard going again, and I was pleased about it, which I would not have predicted in October."],
    ["iron", "06:52 on the dot. Everything back where it should be."],
  ),
  day(
    "2024-01-05",
    ["pool", "Something black and low sat right on the water. Long neck, hooked beak, and it went under and stayed under for ages. Cormorant. Twelve miles from the sea and there it was."],
    ["footbridge", "Frost on the handrail cold enough to stick to my glove."],
  ),
  day(
    "2024-01-08",
    ["step", "Snow in the night, three inches, and nobody's been up the street yet. The first footprints are mine and I minded that they were going to be spoiled."],
    ["ginnel", "Nobody had been down the ginnel either. White wall to wall all the way, and quieter than a room."],
    ["towpath", "The cut is the only black thing left in the world this morning."],
    ["pool", "Heron on the snow at the edge, and the two whites are different whites. His is dirtier."],
  ),
  day(
    "2024-01-10",
    ["veritys", "Snow on the dead cars makes them look like they're under dust sheets."],
    ["back", "Nobody had walked the far bank yet. I did it anyway and felt like a vandal."],
  ),
  day(
    "2024-01-12",
    ["towpath", "There's a dead thing in the water below the iron bridge. Fur, about the size of a cat. I looked once and then didn't."],
    ["iron", "Radio man went past while I was looking at it and neither of us said anything about it, which was correct."],
  ),
  day(
    "2024-01-15",
    ["step", "Coldest yet. The air actually hurts the top of your mouth."],
    ["bridge41", "The icicles are back and bigger. One of them has reached the water."],
    ["pool", "Heron. Fourteen mornings out of the last fifteen. In October he was sometimes."],
  ),
  day(
    "2024-01-17",
    ["footbridge", "From up here you can see your own feet through the ice at the edge of the pool. Weed all lying the same way underneath, like hair."],
    ["veritys", "Grey barked and his breath came out with it."],
  ),
  day(
    "2024-01-19",
    ["towpath", "Dead thing gone. Either it went downstream or something had it."],
    ["back", "On at eight and I was still on the far bank at ten past seven, half running. Not doing that again."],
  ),
  day(
    "2024-01-22",
    ["step", "Thaw. Everything dripping and the whole street full of the sound of it."],
    ["towpath", "The mattress is a hump now. Whatever's left of the floral bit is under weed and it looks like part of the bank. Give it a year and something will nest on it."],
  ),
  day(
    "2024-01-24",
    ["iron", "06:52 cancelled, and it said so on the board up on the platform, and a man on the bridge said a word I'm not writing down."],
    ["pool", "No heron. Cormorant again, or the same one, in the same place, doing the same thing."],
  ),
  day(
    "2024-01-26",
    ["ginnel", "Green all up the wall in the ginnel that wasn't there before Christmas. Moss, or the start of it."],
    ["veritys", "New sign on the gate. VERITY & SON. It has always been Verity's. I don't know whether the son is new or the sign is."],
  ),
  day(
    "2024-01-29",
    ["step", "Rain. Sideways."],
    ["footbridge", "Wind strong enough on the footbridge that I held both rails going over, which I have never done."],
    ["back", "A wheelie bin in the cut on the far bank. It's going to be a long February."],
  ),
  day(
    "2024-01-31",
    ["pool", "Heron. I was out on twenty-two mornings in January and he was on eighteen of them."],
    ["back", "January's done and I have walked it every morning it let me. Four months. I did not think I'd get past November."],
  ),

  // ── February ──────────────────────────────────────────────────────────────
  day(
    "2024-02-02",
    ["towpath", "Water an inch under the path the whole way from the ginnel to the bridge. It's going to come over."],
    ["veritys", "Sandbags at the yard gate, four of them, which means they've seen this before."],
  ),
  day(
    "2024-02-05",
    ["step", "Rain all weekend without stopping once. Went out, came straight back in for wellies."],
    ["towpath", "Towpath's under. Not much — an inch, two in the dip past bridge 41 — but under. The cut has no edge this morning. It's just wide."],
    ["bridge41", "Couldn't get through. Water to the top of my wellies at the mouth of it and I'm not that brave."],
  ),
  day(
    "2024-02-07",
    ["step", "Still under, so I did the streets instead. Alma, Fenton, up past the school, back down Bridge Road."],
    ["ginnel", "Stood at the bottom of the ginnel, looked at it, and turned round. Twenty minutes on pavement is not twenty minutes."],
    ["back", "Nothing to write. I saw four cars and a cat."],
  ),
  day(
    "2024-02-09",
    ["step", "It has stopped raining. Everything is still full."],
    ["ginnel", "Third morning on the streets. I know the walk is twenty minutes and I know the streets are twenty minutes and they are not the same twenty minutes."],
  ),
  day(
    "2024-02-12",
    ["towpath", "Back on. Silt over the path an inch thick, the colour of milky tea, and every footprint in it is mine going out and mine coming back."],
    ["bridge41", "There's a line on the brick under the bridge where the water got to. About a foot above where it normally sits. That'll still be there in July."],
    ["pool", "Heron. I'd have been upset if he wasn't."],
  ),
  day(
    "2024-02-13",
    ["iron", "Somebody has painted IT'S NOT on the girder. White, letters a foot high, and nothing else. IT'S NOT. I have thought about it all morning and it is the best thing anybody has ever written on that bridge."],
    ["veritys", "Whole yard out hosing mud off everything."],
  ),
  day(
    "2024-02-14",
    ["pool", "Heron in the reeds, and the reeds are all lying flat from the flood, so there was nowhere for him to hide and he stood there anyway looking got at."],
    ["footbridge", "Somebody's tied a bunch of forecourt carnations to the rail, still in the cellophane. Not on my side."],
  ),
  day(
    "2024-02-16",
    ["step", "Light at seven. Actual light. It has been dark at this time since the 11th of October and this morning it wasn't."],
    ["iron", "IT'S NOT still there."],
  ),
  day(
    "2024-02-19",
    ["iron", "No 06:52, and there won't be for a fortnight — engineering works, it says, on a laminated sheet on the platform gate. A fortnight of nothing going over."],
    ["towpath", "Snowdrops in the grass by the lock. Somebody planted those, years ago, and then presumably moved away."],
  ),
  day(
    "2024-02-21",
    ["iron", "Radio man said morning. Out loud. Four months of nodding and this morning he said morning, and I said morning, and that was that."],
    ["veritys", "Grey wasn't out. Blanket was."],
  ),
  day(
    "2024-02-23",
    ["ginnel", "Silt line up the ginnel wall about four inches high, so the flood got round the corner and all the way up here."],
    ["pool", "Heron facing into the wind, which must be why they do it, and I have only just this minute thought of that."],
    ["footbridge", "Carnations gone brown inside the cellophane. Nobody has taken them down."],
  ),
  day(
    "2024-02-26",
    ["iron", "The bridge without the train is just a bridge. Nine days now. I keep looking up at ten to seven for no reason."],
    ["back", "Dad rang while I was on the far bank and I rang him back from the step and we talked about nothing for a quarter of an hour."],
  ),
  day(
    "2024-02-28",
    ["step", "Mild. Coat open."],
    ["towpath", "Frogspawn in the ditch by the lock, a great grey mass of it. That's that, then. It's spring, whatever the calendar says."],
    ["pool", "Heron."],
  ),
  day(
    "2024-02-29",
    ["back", "An extra morning. I didn't do anything different with it."],
  ),

  // ── March ─────────────────────────────────────────────────────────────────
  day(
    "2024-03-05",
    ["step", "Damp. Not cold."],
    ["iron", "Still no train. Due back Monday, apparently."],
    ["veritys", "Magnet dropped a bonnet and the yard rang for four seconds, same as always. I still like it."],
    ["pool", "No heron. Two ducks going at each other in the reeds."],
    ["back", "Twenty minutes exactly."],
  ),
  day(
    "2024-03-06",
    ["step", "Dad died at ten past four this morning. Michael rang from the hospital. I got dressed and went out at quarter to seven because I did not know what else to do with myself."],
    ["pool", "Heron."],
  ),
  day(
    "2024-03-18",
    ["step", "First morning back. Quarter to seven."],
    ["towpath", "Everything's green that wasn't."],
  ),
  day("2024-03-19", ["step", "Out and back."]),
  day("2024-03-20", ["pool", "Heron. He doesn't know."]),
  day(
    "2024-03-21",
    ["ginnel", "Nettles."],
    ["towpath", "Blackthorn out along the far side. White, before any leaves. It looks like something's wrong with it."],
  ),
  day(
    "2024-03-22",
    ["iron", "Train's back. I didn't notice until Wednesday, which tells you something."],
  ),
  day("2024-03-25", ["footbridge", "Up eleven, over, down eleven."]),
  day("2024-03-26", ["step", "Rain."]),
  day(
    "2024-03-28",
    ["towpath", "Ducklings. Eight of them, on the towpath side, and the mother took them in under the mattress hump when I got close, which is the first useful thing that mattress has ever done."],
    ["back", "Twenty-four minutes. I stopped and watched them for a bit."],
  ),
  day(
    "2024-03-31",
    ["pool", "Heron, and a heron. Two of them, forty yards apart, both facing the lock, ignoring each other completely."],
  ),

  // ── April ─────────────────────────────────────────────────────────────────
  day(
    "2024-04-02",
    ["step", "Clocks forward. Light at half six now and it feels like a favour I didn't ask for."],
    ["veritys", "Grey's out again, and there's a new board up: VERITY & SON, SCRAP & SALVAGE. So the sign was new and the son isn't."],
  ),
  day(
    "2024-04-04",
    ["towpath", "Swans building on the far bank, right where the reeds went down in the flood. They have the whole cut to choose from and they've chosen the one bit that floods."],
    ["iron", "IT'S NOT is still there and now there's moss growing in the S."],
  ),
  day(
    "2024-04-06",
    ["bridge41", "The flood line's still on the brick. I put my hand flat on it. A foot above where the water is today."],
    ["pool", "Heron."],
  ),
  day(
    "2024-04-09",
    ["veritys", "We cleared Dad's garage on Saturday and half of it could have come here. I kept thinking that while we were doing it, and it isn't a nice thought to have about a person."],
    ["footbridge", "Three ducklings. There were eight on the 28th."],
  ),
  day(
    "2024-04-11",
    ["step", "Warm enough to go out in a shirt and I didn't, out of habit."],
    ["footbridge", "Somebody's fixed the handrail. New bolt, galvanised, brighter than anything round it. I put my thumb on it instead."],
  ),
  day(
    "2024-04-15",
    ["iron", "Radio man had the racing on. Ten to seven in the morning and they were previewing something at Wetherby. He caught me listening and turned it up."],
    ["pool", "No heron. The reeds are up high enough now that he could be stood in there and I'd never know, which changes what no heron means."],
  ),
  day(
    "2024-04-17",
    ["veritys", "Crane arm parked up against a blue sky for once."],
    ["back", "The backs of the houses have all got their windows open and you can hear the telly and one bloke singing. In January you could see into the kitchens and now you can hear them."],
  ),
  day(
    "2024-04-19",
    ["ginnel", "Nettles at the bottom of the ginnel already up to my knee."],
    ["towpath", "Cow parsley started. By June you won't be able to see the water from the path in places."],
  ),
  day(
    "2024-04-22",
    ["pool", "Heron in flight, for the first time all year. Straight up out of the reeds and away over the yard, slow as anything, legs trailing behind him. He is enormous and I had no idea."],
  ),
  day(
    "2024-04-24",
    ["towpath", "Swan sitting. You can just see the top of her over the reeds and the male going up and down the cut like he's on shift."],
  ),
  day(
    "2024-04-27",
    ["step", "Rain, and everything smells of it in a good way now instead of a bad way."],
    ["bridge41", "Four strides. Still four."],
    ["footbridge", "Kids have been on the footbridge in the night. Cans, and a crack in one of the eleven steps that I don't think was there."],
  ),
  day(
    "2024-04-30",
    ["iron", "IT'S NOT has gone. Painted over, in a green that doesn't match the girder, so now there's a green oblong where it was."],
    ["pool", "Heron."],
  ),

  // ── May ───────────────────────────────────────────────────────────────────
  day(
    "2024-05-02",
    ["step", "Out at half six because it's light and I might as well be."],
    ["towpath", "Hawthorn out. The whole far bank has gone white in about four days."],
  ),
  day(
    "2024-05-04",
    ["pool", "Heron and five ducklings in the same ten yards of water and everybody minding their own business."],
    ["veritys", "Something with a brass band in it playing in the yard office."],
  ),
  day(
    "2024-05-07",
    ["towpath", "Cygnets. Five. Ash-coloured and stupid-looking and they can already swim."],
    ["back", "Told the woman at number 12 about the cygnets over the bins and she said oh, are they still at it, they were there when Jean had the house. So the swans have been doing this a lot longer than I have lived here."],
  ),
  day(
    "2024-05-09",
    ["ginnel", "Somebody's painted the back gate at 43 and got it on the ginnel floor, and I expect that to be there for years."],
    ["bridge41", "There's a nest in the brickwork on the far side, right on the flood line. Mud, and a lot of coming and going."],
    ["iron", "The green oblong where IT'S NOT was is fading faster than the girder is."],
  ),
  day(
    "2024-05-13",
    ["ginnel", "The bike frame is back. Not the same one — this one's white and it has one wheel. Same spot on the wall, near enough."],
    ["pool", "Heron on the lock beam. Same beam as December."],
  ),
  day(
    "2024-05-15",
    ["step", "Warm before seven for the first time. No coat, and no coat was correct."],
    ["towpath", "Cow parsley up past my waist. It's started."],
  ),
  day(
    "2024-05-17",
    ["footbridge", "The new bolt has gone dull. It matches now."],
    ["veritys", "Four lads and a van dropping off a Fiesta with no doors on it. Seven in the morning."],
  ),
  day(
    "2024-05-20",
    ["pool", "No heron, but the reeds are over my head at the edge, so I've stopped writing no heron with any confidence."],
    ["back", "Nettles on the far bank right up to the fence. The path's narrowing from both sides and by August it'll be a tunnel."],
  ),
  day(
    "2024-05-23",
    ["iron", "06:52 four minutes early, which shouldn't be possible."],
    ["towpath", "Mattress is completely under now. There's a green mound where it is, and if you didn't know you'd say it was bank."],
  ),
  day(
    "2024-05-25",
    ["step", "Cuckoo spit on everything in the front. Whatever else is going on, it's May."],
    ["footbridge", "Four cygnets. There were five on the 7th."],
  ),
  day(
    "2024-05-28",
    ["veritys", "Grey's got the shade side of the office now. Somebody moved his hook."],
    ["pool", "Heron. First in nine mornings."],
  ),
  day(
    "2024-05-30",
    ["towpath", "A man swimming in the cut below the lock at ten to seven. Front crawl, goggles, absolutely serious about it. I have never been so surprised on this walk."],
    ["back", "Haven't told anybody about the swimmer. Not sure why not."],
  ),

  // ── June ──────────────────────────────────────────────────────────────────
  day(
    "2024-06-01",
    ["step", "Half six and the sun already on the top windows across the street."],
    ["iron", "There's a narrowboat moored below the iron bridge. Green, gold lettering, Hesper. Chimney going."],
  ),
  day(
    "2024-06-04",
    ["iron", "Hesper still there. A woman on the roof with a mug, and a dog that isn't a lurcher."],
    ["pool", "Heron. Reeds or no reeds, he was out on the mud like it was October."],
  ),
  day(
    "2024-06-06",
    ["veritys", "The yard's got a new magnet, or the old one's been painted. It's orange."],
    ["footbridge", "Three cygnets."],
  ),
  day(
    "2024-06-08",
    ["towpath", "Cow parsley over now, all going to seed and leaning out across the path, and it catches your legs going past."],
    ["iron", "The woman on Hesper said good morning and asked if the water was always this colour. I said yes. She said right, and laughed."],
  ),
  day(
    "2024-06-11",
    ["step", "Muggy. First morning I've come back sweating."],
    ["pool", "No heron. Two coots having a proper fight, feet and everything."],
  ),
  day(
    "2024-06-13",
    ["iron", "Hesper's gone. Two holes in the towpath where her pins were and the grass round them still flat."],
  ),
  day(
    "2024-06-17",
    ["veritys", "Grey lying in the gateway in the sun with his back legs out behind him like a frog."],
    ["back", "Somebody's had a barbecue on the far bank and left it. Foil tray, cans, and a burnt circle in the grass."],
  ),
  day(
    "2024-06-19",
    ["bridge41", "Dry under the bridge. It has dripped on me every morning since October and this morning it didn't, and I minded."],
    ["towpath", "Water's dropped. A foot of dry mud at the edge, and the mattress mound is out of the water again with the weed on it going brown."],
    ["pool", "Heron on the mud, and there is a lot more mud than there was."],
  ),
  day(
    "2024-06-21",
    ["footbridge", "The woman in the red coat was on the footbridge. Same coat, in June, in this heat, laughing at something on her phone and holding the rail with her other hand. I said morning. She said morning. I don't know whether she remembered and I hope she doesn't."],
    ["back", "Longest day. Twenty-one minutes."],
  ),
  day(
    "2024-06-24",
    ["step", "Somebody's put a For Sale board up at 39."],
    ["iron", "Radio man's not been about for a bit. I'd been noticing for a week and only wrote it down now."],
  ),
  day(
    "2024-06-26",
    ["ginnel", "Blossom on the blackberries at the top of the ginnel. In October they were going over. Round it comes."],
    ["pool", "Heron, and then a train, and he went. Seven months of trains going over that bridge and this morning it bothered him."],
  ),
  day(
    "2024-06-29",
    ["step", "Rain, warm rain, and the street steaming afterwards."],
    ["veritys", "Yard's shut Saturdays now, apparently. Sign says so."],
  ),

  // ── July ──────────────────────────────────────────────────────────────────
  day(
    "2024-07-01",
    ["towpath", "It smells. Low water and heat and something underneath it, and it's the first time this walk has smelt bad."],
    ["pool", "No heron. Green stuff all over the top of the pool, thick as carpet in the corners."],
  ),
  day(
    "2024-07-03",
    ["iron", "No radio man. Two weeks now."],
    ["veritys", "Grey's hook is empty and his blanket's gone off the concrete."],
  ),
  day(
    "2024-07-06",
    ["step", "Out at quarter past six. It's the only cool part of the day."],
    ["footbridge", "Rail too hot to hold by seven."],
  ),
  day(
    "2024-07-08",
    ["veritys", "Asked the lad on the gate about the dog. He said the dog? and I said the grey one, and he said oh, before my time. So the lad's new and the dog isn't there and that's all I'm getting."],
    ["pool", "Heron. First in eleven mornings."],
  ),
  day(
    "2024-07-11",
    ["towpath", "Four kids in the cut, jumping in off the footbridge steps, about eleven years old. I said nothing. I thought about the shopping trolley that's been down there since March and I still said nothing."],
    ["back", "Thought about those kids all the way home and I'm still not sure."],
  ),
  day(
    "2024-07-13",
    ["iron", "The green oblong where IT'S NOT was has faded right into the girder. You'd have to know."],
    ["pool", "Heron in the shade under the far side, which is new. Even he's had enough."],
  ),
  day(
    "2024-07-16",
    ["step", "Thunder in the night and it has cleared nothing."],
    ["veritys", "The crane arm against the sky at seven in the morning in July is, and I'm not apologising for this, beautiful."],
  ),
  day(
    "2024-07-19",
    ["bridge41", "Somebody's chalked a hopscotch grid under the bridge where it's dry. Four strides straight through the middle of it."],
    ["towpath", "Water so low you can see a bike in it by bridge 41. Frame and one wheel. Been in there years, obviously."],
    ["footbridge", "Two cygnets, nearly the size of the parents and still grey."],
  ),
  day(
    "2024-07-22",
    ["iron", "Radio man. Five weeks, and there he was, with a stick, going slower, radio in his hand instead of his pocket. He said morning. I said it's good to see you, which was more than I meant to say."],
    ["pool", "Heron."],
  ),
  day(
    "2024-07-25",
    ["step", "Cooler. Cloud. Everybody on the street looks relieved."],
    ["towpath", "Rain in the night, the cut's up two inches, and it doesn't smell."],
  ),
  day(
    "2024-07-27",
    ["veritys", "New dog. Young, black, all legs, barking at nothing in the wrong direction. Different hook."],
    ["pool", "No heron."],
  ),
  day(
    "2024-07-29",
    ["veritys", "The new dog barked at me properly this time, which I suppose is progress."],
    ["ginnel", "Nettles gone over, and somebody's strimmed the bottom of the ginnel. Council, or 43."],
  ),
  day(
    "2024-07-31",
    ["back", "Ten months of this. I could not tell you what any of it is for."],
  ),

  // ── August ────────────────────────────────────────────────────────────────
  day(
    "2024-08-02",
    ["towpath", "They've strimmed the towpath. Both sides, right back to the fence. It's tidy and I hate it. All the cow parsley cut off at nine inches like a bad haircut."],
    ["bridge41", "Dripping again after the rain, and I put my hand up into it, which I have never done."],
    ["pool", "Heron."],
  ),
  day(
    "2024-08-05",
    ["iron", "Radio man's stick is a proper one now, with a rubber foot. Racing was on."],
    ["footbridge", "One cygnet."],
  ),
  day(
    "2024-08-07",
    ["step", "Chilly first thing. First time since May I've thought that."],
    ["veritys", "The new dog's got a name — somebody shouted it. Bruno. Grey never had one, as far as I know."],
  ),
  day(
    "2024-08-09",
    ["towpath", "Away for a week from tomorrow. Doncaster, Michael's, the house stuff."],
    ["back", "Walked it twice this morning. Out and back and out and back, forty minutes, because I won't get it for a week."],
  ),
  day(
    "2024-08-19",
    ["step", "Back. Quarter to seven."],
    ["towpath", "Eleven days, and the strimmed edge has grown back three inches and gone straight for the water. Nothing stays tidy."],
    ["pool", "Heron, and I'll admit I was checking."],
  ),
  day(
    "2024-08-21",
    ["ginnel", "Blackberries at the top of the ginnel, ripe, and I got four. Stood on the bin to reach them, which last October I wouldn't have done in front of the street."],
    ["iron", "06:52 went over as I came under. Rain of rust off the girders, like it always does."],
  ),
  day(
    "2024-08-23",
    ["veritys", "Bruno's got Grey's blanket. It's been washed."],
    ["pool", "No heron."],
  ),
  day(
    "2024-08-27",
    ["step", "Dark-ish at quarter to seven. Here we go."],
    ["towpath", "Mist on the water for the first time since — I looked it up — the 12th of October."],
    ["footbridge", "Spider webs on every one of the handrail brackets going up. Fifty of them, all with dew on."],
  ),
  day(
    "2024-08-29",
    ["footbridge", "The cygnet's white at the neck now. There were five in May, and I have not written down what happened to the other four, because I don't know."],
    ["back", "Blackberry stains on the back of my hand at work and somebody asked."],
  ),
  day(
    "2024-08-31",
    ["pool", "Heron. Nothing else. Wrote it on the footbridge and put my phone away."],
  ),

  // ── September ─────────────────────────────────────────────────────────────
  day(
    "2024-09-02",
    ["step", "Coat. First coat since April."],
    ["veritys", "Yard's back to weekdays and Saturdays. The sign's been changed again."],
  ),
  day(
    "2024-09-04",
    ["towpath", "Conkers down the far side already. Everything is about three weeks early, or I have stopped keeping track."],
    ["pool", "Heron. Second one this month and it's only the fourth."],
  ),
  day(
    "2024-09-06",
    ["iron", "Radio man in a coat. He said here we go again, and neither of us had to say what about."],
    ["bridge41", "The flood line's still on the brick. Seven months."],
  ),
  day(
    "2024-09-09",
    ["ginnel", "Somebody's taken the white bike frame. There's a clean patch on the wall where it was."],
    ["pool", "No heron."],
  ),
  day(
    "2024-09-11",
    ["step", "Torch out of the drawer. Batteries in it this time."],
    ["towpath", "Leaves starting on the water. Not many. The first ones lie flat."],
  ),
  day(
    "2024-09-13",
    ["veritys", "Bruno barked twice and then wagged."],
    ["pool", "Heron."],
  ),
  day(
    "2024-09-17",
    ["footbridge", "Swan on her own. I don't know where the young one's gone and I have decided that's normal."],
    ["iron", "06:52 late. Two minutes. It didn't bother me, and in October it would have."],
  ),
  day(
    "2024-09-19",
    ["step", "Rain. Proper autumn rain, in it for the day."],
    ["towpath", "Cut's up and the colour's back to tea."],
  ),
  day(
    "2024-09-23",
    ["pool", "Heron in the reeds, and the reeds are going down again, so I can see him. Six months where no heron meant nothing, and now it means something again."],
    ["veritys", "Magnet ringing the yard. Four seconds. I counted."],
  ),
  day(
    "2024-09-26",
    ["towpath", "The heron was stood on the mattress. On the mound, on the weed on top of it, right in the middle, and it held him. Eleven months that thing has been in the water annoying me and this morning it was somewhere for a heron to stand."],
    ["back", "Twenty-three minutes."],
  ),
  day(
    "2024-09-27",
    ["pool", "Nothing at the pool. He was three hundred yards back down the cut, stood on a mattress, presumably."],
  ),
  day(
    "2024-09-30",
    ["step", "Last morning of the year. Quarter to seven. Cold enough for a coat and I took one."],
    ["towpath", "The water is whatever colour the sky is, and today the sky is nothing much."],
    ["pool", "Heron on the far side, facing away from me. He didn't move once in the time I stood there, and I stood there too long."],
    ["back", "Twenty-two minutes. It's supposed to be twenty."],
  ),
];
