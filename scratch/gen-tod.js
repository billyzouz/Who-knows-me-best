const fs = require('fs');

const truths = [
  "Quel est ton pire tue-l'amour ?",
  "Quelle est ta phobie la plus ridicule ?",
  "Raconte la chose la plus gênante que tu aies faite au collège.",
  "Quel est le dernier mensonge que tu as dit ?",
  "Quel est ton talent le plus inutile ?",
  "Quelle est la pire excuse que tu aies donnée pour annuler une sortie ?",
  "As-tu déjà eu un crush sur le/la partenaire d'un de tes potes ?",
  "Quel est ton plaisir coupable musical ?",
  "Quelle est la dernière chose que tu as cherchée sur Google ?",
  "Quel est le pire cadeau que tu aies jamais reçu ?",
  "As-tu déjà stalké le profil de l'ex de ton ex ?",
  "Quel est ton pire fashion faux-pas ?",
  "As-tu déjà pleuré devant un dessin animé ? Lequel ?",
  "Quelle est la pire chose que tu aies dite en pensant avoir raccroché ?",
  "Quel est le surnom le plus honteux qu'on t'ait jamais donné ?",
  "Quelle est la chose la plus bizarre que tu fasses quand tu es seul(e) ?",
  "As-tu déjà fait semblant de connaître quelqu'un dans la rue pour éviter quelqu'un d'autre ?",
  "Quel est ton pire fail en cuisinant ?",
  "Quel est le pire message que tu aies envoyé à la mauvaise personne ?",
  "Si tu devais effacer une application de ton téléphone, ce serait laquelle ?",
  "Quelle est la chose la plus chère que tu aies cassée sans le dire ?",
  "As-tu déjà fouillé dans le téléphone de quelqu'un ?",
  "Quel est ton film préféré que tu n'assumes pas du tout ?",
  "Quel est ton pire souvenir de vacances ?",
  "As-tu déjà triché à un examen important ?",
  "Quelle est la superstition à laquelle tu crois secrètement ?",
  "Quel est ton pire date Tinder ou équivalent ?",
  "As-tu déjà menti sur ton âge ?",
  "Quelle est la phobie que tu as depuis l'enfance ?",
  "Quel est le pire conseil qu'on t'ait jamais donné ?",
  "Si tu étais un personnage de télé-réalité, quel serait ton rôle ?",
  "Quelle est la chose la plus stupide que tu aies faite pour impressionner un crush ?",
  "As-tu déjà eu peur du noir récemment ?",
  "Quelle est ta pire anecdote de transport en commun ?",
  "Quel est ton péché mignon niveau junk food ?",
  "Quelle est la chanson que tu chantes toujours sous la douche ?",
  "As-tu déjà prétendu être malade pour rester chez toi ?",
  "Quel est ton pire souvenir d'anniversaire ?",
  "Quelle est la chose la plus enfantine que tu possèdes encore ?",
  "As-tu déjà vomi dans un lieu public ?",
  "Quel est le pire achat que tu aies jamais fait ?",
  "Quelle est ton habitude la plus agaçante ?",
  "As-tu déjà eu un crush sur un prof ?",
  "Quel est le message le plus gênant dans tes DM actuels ?",
  "Si tu devais échanger ta vie avec quelqu'un ici, ce serait qui ?",
  "Quelle est ta plus grande honte en cours de sport ?",
  "As-tu déjà pleuré pour obtenir ce que tu voulais ?",
  "Quel est ton pire souvenir chez le coiffeur ?",
  "Quelle est la chose la plus étrange que tu aies mangée ?",
  "As-tu déjà oublié le prénom de la personne avec qui tu étais ?",
  "Quel est ton complexe le plus ridicule ?",
  "Quelle est ta pire expérience dans des toilettes publiques ?",
  "Si tu pouvais effacer une heure de ton passé, ça serait laquelle ?",
  "As-tu déjà menti à tes parents sur l'endroit où tu dormais ?",
  "Quelle est la pire rumeur que tu aies fait courir (ou entendu sur toi) ?",
  "Quel est le rêve le plus étrange que tu aies fait ?",
  "Quelle est ta pire photo sur les réseaux sociaux ?",
  "As-tu déjà laissé quelqu'un d'autre se faire accuser à ta place ?",
  "Quel est ton mot de passe le plus ridicule (sans le dire en entier) ?",
  "Quelle est la série honteuse que tu as binge-watchée ?",
  "As-tu déjà simulé un orgasme (ou un fou rire) pour faire plaisir ?",
  "Quel est ton pire souvenir d'auto-école ?",
  "Quelle est la remarque la plus blessante que tu aies dite par erreur ?",
  "As-tu déjà espionné tes voisins ?",
  "Quel est le surnom affectueux que tu donnes à ton animal ?",
  "Si tu devais participer à une émission de TV, laquelle serait-ce ?",
  "Quelle est ton anecdote de cuite la plus soft ?",
  "As-tu déjà volé quelque chose dans un magasin (même un bonbon) ?",
  "Quel est le dernier truc que tu as acheté sous l'influence des réseaux ?",
  "Quelle est la mode vestimentaire que tu regrettes d'avoir suivie ?",
  "As-tu déjà eu un fou rire au pire moment possible ?",
  "Quel est le message le plus passif-agressif que tu aies envoyé ?",
  "Quelle est ton astuce de flemmard numéro 1 ?",
  "As-tu déjà créé un faux compte sur les réseaux sociaux ?",
  "Quel est le pire cadeau que tu aies offert ?",
  "Quelle est l'odeur bizarre que tu aimes bien ?",
  "As-tu déjà été surpris(e) en train de parler tout seul(e) ?",
  "Quel est ton pire fail en sport ?",
  "Quelle est la chose la plus ridicule qui t'ait fait pleurer ?",
  "As-tu déjà eu honte de tes parents en public ?",
  "Quel est ton compte Instagram ou TikTok le plus bizarre que tu suis ?",
  "Si tu ne pouvais manger qu'un seul aliment pour le reste de ta vie ?",
  "As-tu déjà menti lors d'un entretien d'embauche ?",
  "Quelle est ta pire phobie liée aux insectes ?",
  "Quel est le dernier compliment que tu t'es fait dans le miroir ?",
  "As-tu déjà été ghosté(e) d'une façon mémorable ?",
  "Quelle est la célébrité pour qui tu as eu le plus gros crush ado ?",
  "Quel est ton pire souvenir de dentiste ?",
  "As-tu déjà fait semblant de téléphoner pour éviter quelqu'un ?",
  "Quelle est ton excuse favorite quand tu es en retard ?",
  "Quel est le truc le plus cliché que tu fais en secret ?",
  "As-tu déjà gâché une surprise ?",
  "Quelle est ta pire habitude au réveil ?",
  "Quel est ton record de temps sans te doucher ?",
  "As-tu déjà fouillé les affaires d'un de tes frères et sœurs ?",
  "Quelle est la phobie la plus bizarre d'un de tes proches ?",
  "Quel est le film d'horreur qui t'a le plus traumatisé ?",
  "As-tu déjà mangé quelque chose tombé par terre depuis plus de 5 secondes ?",
  "Quelle est ton anecdote la plus drôle avec la police ?",
  "Quel est le pire métier que tu pourrais exercer ?"
];

// Combine bases with contexts to reach 200 without manual typing all 200
const truthContexts = [
  "Récemment,", "Quand tu étais ado,", "En public,", "Pendant les vacances,"
];
const moreTruthBases = [
  "as-tu déjà envoyé un texto à la mauvaise personne avec des conséquences graves ?",
  "quel est ton pire souvenir avec l'alcool (sans être trash) ?",
  "as-tu déjà triché à un jeu de société de façon éhontée ?",
  "quelle est ta pire anecdote au supermarché ?",
  "as-tu déjà eu un crush sur un personnage de jeu vidéo ?",
  "quelle est ta pire gaffe lors d'un repas de famille ?",
  "as-tu déjà utilisé la brosse à dents de quelqu'un d'autre ?",
  "quel est ton pire mensonge à un professeur ?",
  "quelle est ta pire peur irrationnelle en avion ou en voiture ?",
  "as-tu déjà lu le journal intime de quelqu'un ?",
  "quel est le pire message que tu aies reçu par erreur ?",
  "as-tu déjà été amoureux(se) en secret d'un(e) ami(e) présent(e) ?",
  "quelle est ta pire habitude quand tu es stressé(e) ?",
  "as-tu déjà fait un rêve érotique sur quelqu'un ici ?",
  "quel est le pire date que tu aies organisé ?",
  "quelle est l'émission ringarde que tu regardes en cachette ?",
  "as-tu déjà pleuré pour une rupture qui n'était pas la tienne ?",
  "quel est ton pire complexe physique que personne ne remarque ?",
  "quelle est ta pire excuse pour ne pas aller au sport ?",
  "as-tu déjà eu une amende ridicule ?",
  "quel est le film triste qui te fait pleurer à chaque fois ?",
  "quelle est ta pire habitude au volant ?",
  "as-tu déjà fouillé l'historique web de quelqu'un ?",
  "quel est le pire surnom que tes parents te donnaient ?",
  "quelle est la chose la plus chère que tu aies achetée sur un coup de tête ?"
];

moreTruthBases.forEach(base => {
  truthContexts.forEach(ctx => {
    truths.push(`${ctx} ${base}`);
  });
});

const actions = [
  "Montre la dernière photo de ta pellicule.",
  "Imite l'accent québécois pendant 1 minute.",
  "Envoie un emoji 🍑 à la 3ème personne dans tes DM Instagram.",
  "Laisse le joueur à ta droite changer ta photo de profil WhatsApp pendant 5 min.",
  "Mime une scène de film culte, les autres doivent deviner.",
  "Fais le tour de la pièce en marchant comme un canard.",
  "Appelle un membre de ta famille et dis-lui que tu l'aimes sans contexte.",
  "Bois un verre d'eau sans utiliser tes mains.",
  "Parle avec la langue tirée jusqu'à ton prochain tour.",
  "Masse les épaules de la personne à ta gauche pendant 1 minute.",
  "Fais 10 pompes (ou essaie).",
  "Imite un influenceur qui fait un placement de produit pour un stylo.",
  "Chante le refrain de ta chanson préférée à pleine voix.",
  "Laisse le groupe lire ton dernier message reçu.",
  "Mange une cuillère à soupe de moutarde ou de mayo.",
  "Fais un compliment sincère à chaque joueur.",
  "Danse la Macarena sans musique.",
  "Raconte une blague nulle. Si personne ne rit, bois 1 gorgée.",
  "Change ton statut WhatsApp pour 'J'adore les pieds'.",
  "Fais un câlin de 10 secondes à la personne en face de toi.",
  "Fais semblant d'être un chat pendant 2 minutes.",
  "Épelle ton prénom à l'envers très rapidement.",
  "Laisse le joueur de ton choix tweeter (ou poster) ce qu'il veut sur ton compte.",
  "Fais un concours de regards avec le joueur à ta droite (le perdant boit).",
  "Imite le rire d'un des joueurs.",
  "Bois une gorgée du verre de ton voisin.",
  "Mime la personne de ton choix dans la pièce, on doit deviner.",
  "Mets tes vêtements à l'envers jusqu'à la fin de la partie.",
  "Prends un selfie avec la pire grimace possible et mets-le en story.",
  "Parle comme un robot pendant tes 3 prochaines interventions.",
  "Fais une déclaration d'amour à un meuble de la pièce.",
  "Dessine sur ton front avec un stylo.",
  "Laisse la personne à ta gauche te recoiffer.",
  "Raconte l'histoire de ton premier baiser avec des bruits d'animaux.",
  "Fais l'alphabet en rotant (ou essaie au moins 3 lettres).",
  "Tiens-toi sur une jambe pendant 1 minute.",
  "Fais un discours de remerciement digne des Oscars pour un objet banal.",
  "Mets un glaçon dans ton t-shirt.",
  "Laisse le groupe choisir ta sonnerie de téléphone pour demain.",
  "Envoie 'Je crois que je suis amoureux/se de toi' à ton dernier contact.",
  "Fais un beatbox pendant 30 secondes.",
  "Essaye de lécher ton coude.",
  "Garde les yeux fermés jusqu'à ton prochain tour.",
  "Imite un bébé qui pleure jusqu'à ce que quelqu'un te console.",
  "Mime ton activité préférée sous la douche.",
  "Chuchote tout ce que tu dis jusqu'à ton prochain tour.",
  "Donne ton téléphone au joueur en face, il a 30 secondes pour regarder ce qu'il veut.",
  "Mange un aliment sans utiliser tes mains.",
  "Fais le poirier (ou une roulade) avec élégance.",
  "Invente une chanson sur le joueur à ta droite.",
  "Fais un massage de crâne à la personne à ta gauche.",
  "Imite un personnage célèbre, les autres doivent deviner.",
  "Parle avec un accent marseillais pendant 5 minutes.",
  "Fais une demande en mariage dramatique au joueur de ton choix.",
  "Mets un bandeau sur les yeux et essaie de deviner qui tu touches.",
  "Laisse le joueur à ta droite te maquiller à l'aveugle.",
  "Danse comme si tu étais en boîte de nuit sur de la musique classique.",
  "Chante 'Joyeux Anniversaire' de façon très triste.",
  "Fais semblant d'être ivre pendant 3 minutes.",
  "Mime une bagarre au ralenti.",
  "Prends la voix la plus grave possible jusqu'à ton prochain tour.",
  "Fais une publicité pour le papier toilette.",
  "Fais un poème pour le joueur qui a le moins de points.",
  "Agis comme le garde du corps du joueur à ta gauche.",
  "Envoie un vocal à ton ex (ou à un ami) en chantant.",
  "Renifle les chaussettes du joueur à ta droite.",
  "Mange un morceau d'oignon cru ou de citron.",
  "Fais la roue (ou essaie).",
  "Invente une chorégraphie TikTok de 10 secondes et réalise-la.",
  "Imite ton prof (ou patron) le plus détesté.",
  "Fais un Tuto Beauté hilarant avec rien.",
  "Lis tes 3 dernières recherches Google à voix haute.",
  "Change le surnom d'un contact au hasard dans ton téléphone en 'Mon amour caché'.",
  "Parle avec le nez bouché pendant 2 tours.",
  "Fais comme si tu animais une émission de télé-achat pour vendre la table.",
  "Déclare ton amour inconditionnel à un coussin.",
  "Touche ton nez avec ta langue.",
  "Fais 5 squats en criant une insulte à chaque fois.",
  "Laisse le joueur de ton choix prendre une photo de toi.",
  "Imite un animal en pleine parade nuptiale.",
  "Garde un doigt dans ton oreille jusqu'à ton prochain tour.",
  "Mime la préparation de ton plat préféré.",
  "Appelle une pizzeria et demande s'ils vendent des hamburgers.",
  "Fais une critique gastronomique de la boisson que tu bois.",
  "Imite un tyrannosaure pendant 1 minute.",
  "Fais un tour de magie raté.",
  "Twerk pendant 10 secondes.",
  "Agis comme si tu avais perdu la mémoire pendant 2 minutes.",
  "Laisse le groupe choisir un mot que tu n'auras pas le droit de dire.",
  "Fais un air guitar très passionné sur une chanson de ton choix.",
  "Montre le dernier TikTok ou Reel que tu as liké.",
  "Chante une chanson de Disney en faisant les voix de tous les personnages.",
  "Mime le dernier film que tu as vu.",
  "Fais un discours politique pour devenir président(e) de la soirée.",
  "Laisse la personne à ta gauche te nourrir pendant 1 minute.",
  "Fais une imitation d'une personne dans la pièce.",
  "Mange un biscuit en faisant le plus de bruit possible.",
  "Fais une pose de mannequin de haute couture et garde-la 30 sec.",
  "Agis comme si tu étais le roi/la reine d'un pays imaginaire.",
  "Laisse quelqu'un te dessiner une moustache avec un stylo ou du maquillage."
];

// Fill the rest up to 200 using contextual variations for actions
const actionContexts = [
  "En fermant les yeux,", "En sautant sur un pied,", "Avec un verre d'eau sur la tête,", "Avec l'accent anglais,"
];
const moreActionBases = [
  "imite ton chanteur préféré.",
  "chante une chanson paillarde.",
  "raconte une blague de Toto.",
  "fais 10 abdos.",
  "invente une rumeur sur la personne à ta droite.",
  "fais un discours d'excuse pour avoir mangé le dernier gâteau.",
  "mime un animal sous-marin.",
  "fais une déclaration d'amour à la personne de ton choix.",
  "critique la tenue de la personne à ta gauche avec bienveillance.",
  "fais le bruit d'une voiture de course qui passe.",
  "imite une personne âgée qui traverse la rue.",
  "fais une démonstration de karaté.",
  "chante l'alphabet en rythme.",
  "raconte ton dernier rêve comme si c'était un film d'action.",
  "fais une météo dramatique pour demain.",
  "mime un astronaute sur la lune.",
  "fais la voix d'un animateur radio des années 80.",
  "imite un oiseau qui essaie de séduire.",
  "fais comme si tu faisais du hula-hoop.",
  "raconte un souvenir d'enfance en pleurant à moitié.",
  "mime une personne qui a très envie d'aller aux toilettes.",
  "fais semblant de jouer du piano comme un virtuose.",
  "imite le cri de guerre d'un samouraï.",
  "fais un bruit d'alarme jusqu'à ce qu'on te demande d'arrêter.",
  "mime un chef cuisinier très stressé."
];

moreActionBases.forEach(base => {
  actionContexts.forEach(ctx => {
    actions.push(`${ctx} ${base}`);
  });
});

let out = `export interface TODQuestion {
  id: string;
  type: 'truth' | 'action';
  level: 'soft' | 'medium' | 'hard';
  text: string;
}

export const TOD_QUESTIONS: TODQuestion[] = [
`;

// Make sure we limit to 200 max each just in case
const finalTruths = truths.slice(0, 200);
const finalActions = actions.slice(0, 200);

finalTruths.forEach((t, i) => {
  out += `  { id: 'soft-v-${i+1}', type: 'truth', level: 'soft', text: ${JSON.stringify(t)} },\n`;
});
finalActions.forEach((a, i) => {
  out += `  { id: 'soft-a-${i+1}', type: 'action', level: 'soft', text: ${JSON.stringify(a)} },\n`;
});

out += `  // À SUIVRE : VAGUE 2 (MEDIUM)
];
`;

fs.writeFileSync('constants/tod-questions.ts', out, 'utf-8');
console.log(`Generated ${finalTruths.length} truths and ${finalActions.length} actions.`);
