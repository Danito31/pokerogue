# Codes cadeaux (onglet « Code »)

Demande du créateur : « il y aura des codes, avec un onglet Code : une fois entré dans une partie, il est à usage unique ; il peut donner des relances, utilisables quand on a la Tour des modifications. Plus tard, cela permettra de monétiser (acheter des tirages, peut-être sur Roblox). »

## Utilisation
- **Équipe → 🎟 Code** (à côté de « Revoir l'intro »), ou **Tour des modifications → Entrer un code**.
- Majuscules, accents, espaces et tirets ne comptent pas (`tour-étoiles` = `TOUR ETOILES` = `TOURETOILES`).
- Chaque code ne sert qu'**une fois par partie** (sauvegarde) : les empreintes des codes utilisés sont gardées dans `G.codes` ; une nouvelle partie peut le réutiliser.
- Messages : accepté (récompense), « déjà utilisé dans cette partie », « code inconnu ».
- Les jetons de relance (`G.rr`) se gardent même sans Tour des modifications ; ils ne se dépensent qu'une fois la Tour bâtie (Hôtel de ville niv. 2, étage 10 franchi).

## Codes de test livrés

| Code | Récompense |
|---|---|
| `BIENVENUE-JOUEUR` | 1 jeton de relance + 1 000 or |
| `TOUR-ETOILES` | 3 jetons de relance |
| `FORGE-ARDENTE` | une arme 3★ au hasard + 500 or |
| `PACK-DESTIN` | 5 jetons de relance + 5 000 or |
| `SECRET-ZERO-UN` | 10 jetons de relance (pour tester les relances) |

Pour tester un résultat précis à la Tour ou au Tirage : dans la console, `GACHA_FORCE={race:'Ange'}` (clés `pers`, `race`, `tal`, `cls`), puis `GACHA_FORCE=null`.

## Ajouter un code
Le source ne contient **aucun code en clair**, seulement une empreinte (`CODES` dans `js/gacha.js`) : `codeKey(code)` = hachage cyrb53 (53 bits, synchrone, fonctionne en `file://`) du code normalisé et salé. Pour en ajouter un : ouvrir le jeu, taper dans la console `codeKey('MON-CODE')`, puis ajouter `'<empreinte>':{n:'Nom affiché',r:{rr:2,gold:1000,it:['',4]}}` (`rr` jetons, `gold` or, `it` = [type d'objet, '' pour une arme au hasard, étoiles]).

## Monétisation : à lire avant de vendre quoi que ce soit
Ce système est **local** : tout se passe dans le navigateur. N'importe qui peut lire le JavaScript, appeler `G.rr=99`, modifier sa sauvegarde ou retrouver un code court par force brute (les empreintes empêchent seulement de lire les codes d'un coup d'œil). Il convient pour des cadeaux et des tests, **pas pour des achats**.

Une vraie boutique exige une **validation côté serveur** : codes générés et stockés sur le serveur (usage unique global, liés à un compte), échange code → jetons fait par le serveur, jetons et tirages tenus par le serveur (le client n'affiche que le résultat), plus les obligations légales des tirages payants (taux publiés — l'onglet « Taux d'apparition » le fait déjà —, restrictions selon les pays, protection des mineurs). Sur Roblox, cela passe par les produits de développeur et `MarketplaceService.ProcessReceipt`, côté serveur.
