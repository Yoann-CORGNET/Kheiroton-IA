# Skill : Analyse comparative de programmes politiques

## Input requis
- Liste de programmes politiques (texte, PDF ou URLs)
- Élection ciblée (ex: Présidentielle 2027, Législatives 2027)
- [Optionnel] Thèmes prioritaires à approfondir

## Processus en 6 étapes

---

### Étape 1 — Extraction des promesses

Pour chaque programme, extraire les promesses concrètes en les classant :

**Classification :**
- `PROMESSE_CONCRETE` : engagement mesurable avec action spécifique (ex: "créer 100 000 places en crèche")
- `PROMESSE_VAGUE` : aspiration sans mesure quantifiable (ex: "améliorer le système de santé")
- `CONSTAT` : description de la situation actuelle
- `CRITIQUE` : attaque de l'adversaire
- `VALEUR` : principe idéologique

**Pour chaque PROMESSE_CONCRETE, extraire :**
- **Action** : verbe + objet (ex: "augmenter le SMIC")
- **Quantification** : montant, nombre, pourcentage (ex: "+200 EUR/mois")
- **Échéance** : date ou délai (ex: "d'ici 2029")
- **Population cible** : qui est concerné (ex: "salariés au SMIC")
- **Coût annoncé** : chiffrage du candidat (si disponible)
- **Financement** : source de financement proposée (ex: "taxe sur les superprofits")
- **Thème** : parmi les 14 catégories standardisées

**14 thèmes standardisés :**
économie, emploi, retraites, santé, éducation, sécurité, immigration, environnement, logement, institutions, international/défense, culture, agriculture, numérique

---

### Étape 2 — Analyse de faisabilité (par promesse)

Pour chaque promesse concrète, évaluer 6 dimensions :

#### 2.1 Faisabilité juridique (poids : 15%)
- Compatible avec la Constitution française ?
- Compatible avec le droit de l'UE (traités, directives) ?
- Quel véhicule législatif nécessaire ? (loi ordinaire / organique / révision constitutionnelle / décret)
- Niveau de compétence correct ? (commune / département / région / État / UE)
- Textes existants à modifier ?

#### 2.2 Faisabilité budgétaire (poids : 25%)
- Coût estimé réaliste ? Comparer avec des mesures similaires existantes.
- Source de financement crédible ? Rendement réaliste ?
- Impact sur le déficit public (contexte : dette ~116% PIB, déficit ~5,4%)
- Compatibilité avec les engagements européens
- Comparaison avec les chiffrages Institut Montaigne / IFRAP si disponibles

#### 2.3 Faisabilité technique/administrative (poids : 15%)
- L'administration peut-elle mettre en oeuvre ? (personnel, systèmes IT, coordination)
- Délai réaliste de mise en oeuvre
- Réformes administratives préalables nécessaires

#### 2.4 Faisabilité politique (poids : 10%)
- Peut obtenir une majorité parlementaire ? (contexte : 3 blocs, pas de majorité absolue)
- Opposition prévisible de quels partis/groupes ?
- Utilisation du 49.3 probable ?

#### 2.5 Faisabilité temporelle (poids : 10%)
- Réalisable dans le calendrier annoncé ?
- Étapes préalables (consultations, études d'impact, navette parlementaire)
- Comparaison avec le temps de mise en oeuvre de réformes similaires passées

#### 2.6 Acceptabilité sociale (poids : 10%) + Impact socio-économique (poids : 15%)
- Nombre de bénéficiaires directs
- Perdants / populations négativement impactées
- Risque de contestation sociale (grèves, manifestations)
- Effet sur les inégalités
- Effets secondaires non intentionnels

#### Scoring

Chaque dimension : **score 0.00 à 1.00** + **confiance 0.00 à 1.00**

```
Score global = Σ (poids_i × score_i)
Incertitude = Σ (poids_i × (1 - confiance_i))
```

**Échelle :**
| Score | Label | Interprétation |
|-------|-------|----------------|
| 0.80+ | Très faisable | Réaliste et bien pensé |
| 0.60-0.79 | Faisable | Faisable avec ajustements |
| 0.40-0.59 | Partiellement faisable | Obstacles significatifs |
| 0.20-0.39 | Difficilement faisable | Obstacles majeurs |
| <0.20 | Irréaliste | Juridiquement impossible ou budgétairement absurde |

---

### Étape 3 — Vérification factuelle

Pour chaque promesse :
- Les chiffres avancés sont-ils exacts ? (croiser avec INSEE, DREES, PLF)
- Les constats sous-jacents sont-ils vrais ?
- Le financement proposé rapporterait-il le montant annoncé ?
- Cohérence avec les autres promesses du même programme ?

**Verdicts :**
- Confirmé : données vérifiées et correctes
- Partiellement exact : ordre de grandeur correct mais détails inexacts
- Trompeur : présentation biaisée de données réelles
- Faux : contredit par les données officielles
- Invérifiable : pas assez de données pour trancher

---

### Étape 4 — Recherche de précédents

Pour chaque promesse :
- Mesures similaires déjà tentées en France : résultat ?
- Mesures comparables à l'étranger : résultat ?
- Conditions de succès identifiées dans la littérature
- Raisons d'échec les plus fréquentes pour ce type de mesure

---

### Étape 5 — Comparaison cross-programmes

#### 5.1 Comparaison par thème
Pour chaque thème, tableau comparatif :

| Promesse | Candidat A | Candidat B | Candidat C |
|----------|-----------|-----------|-----------|
| [Thème X] | Mesure + score | Mesure + score | Mesure + score |

#### 5.2 Bilan budgétaire comparé
Pour chaque programme :
- **Dépenses nouvelles** : total annuel
- **Recettes nouvelles** : total annuel (impôts, taxes)
- **Économies** : total annuel (suppressions, réformes)
- **Solde net** : impact sur le déficit
- **Crédibilité du chiffrage** : score moyen de faisabilité budgétaire

#### 5.3 Positionnement politique
Placer chaque programme sur 6 axes (0-100) :
1. Interventionnisme ↔ Libéralisme
2. Progressisme ↔ Conservatisme
3. Internationalisme ↔ Souverainisme
4. Écologisme ↔ Productivisme
5. Libertaire ↔ Autoritaire
6. Égalitarisme ↔ Méritocratie

#### 5.4 Détection de contradictions
- **Intra-programme** : promesses incompatibles au sein d'un même programme
  (ex: baisser les impôts ET augmenter les dépenses sans nouvelle dette)
- **Inter-programmes** : convergences et divergences entre candidats
  (ex: tous promettent X mais avec des moyens différents)

#### 5.5 Classement global
Moyenne pondérée des scores de faisabilité de toutes les promesses concrètes :
- Par programme (classement global)
- Par thème (quel programme est le plus crédible sur la santé ? l'économie ?)

---

### Étape 6 — Rapport de synthèse

#### Structure du rapport final

```
1. RÉSUMÉ EXÉCUTIF
   - Classement global des programmes par faisabilité
   - 3 forces et 3 faiblesses majeures de chaque programme
   - Promesses les plus et les moins faisables toutes programmes confondus

2. COMPARAISON PAR THÈME (×14 thèmes)
   - Tableau comparatif des promesses
   - Analyse comparative de faisabilité
   - Recommandation : quel programme est le plus crédible sur ce thème

3. ANALYSE BUDGÉTAIRE
   - Bilan financier de chaque programme
   - Impact sur la dette et le déficit
   - Crédibilité des sources de financement

4. FICHES PAR PROMESSE (annexe)
   - Score détaillé sur 6 axes
   - Justification de chaque score
   - Sources citées
   - Précédents historiques

5. POSITIONNEMENT POLITIQUE
   - Compass multi-axes
   - Convergences et divergences

6. CONTRADICTIONS ET INCOHÉRENCES
   - Intra-programme
   - Inter-programmes

7. MÉTHODOLOGIE ET LIMITES
   - Description de la méthodologie
   - Biais identifiés
   - Intervalles de confiance
   - Disclaimer
```

---

## Disclaimer obligatoire

> Cette analyse est produite par un système automatisé utilisant l'intelligence artificielle.
> Elle s'appuie sur des données publiques et des méthodologies transparentes, mais ne remplace
> pas l'expertise humaine, le débat démocratique ou le jugement citoyen.
>
> Les scores de faisabilité sont des estimations probabilistes avec des marges d'incertitude.
> Les biais inhérents aux modèles de langage et aux données utilisées sont documentés.
>
> Sources principales : INSEE, Légifrance, Cour des Comptes, Institut Montaigne, IFRAP,
> OpenFisca, Manifesto Project, Eurostat.

---

## Données de contexte à injecter

### Contexte budgétaire France (à mettre à jour avant chaque analyse)
- PIB : ~2 800 Md EUR (2025)
- Dette publique : ~3 465 Md EUR (116,3% du PIB)
- Déficit public : ~5,4% du PIB
- Intérêts de la dette : ~65-67 Md EUR/an
- Budget État : ~500 Md EUR de dépenses
- Budget Sécu : ~600 Md EUR
- Pression fiscale : ~45% du PIB (plus élevée de l'OCDE)
- Taux de chômage : ~7,3%
- Croissance : ~0,9% (2025)

### Contraintes institutionnelles
- Assemblée nationale : 577 sièges, majorité absolue = 289
- Sénat : majorité différente de l'AN
- 3 blocs : NFP (gauche) ~190, Ensemble (centre) ~160, RN (droite) ~140
- Article 49.3 : passage sans vote mais risque de motion de censure
- Article 40 : Parlement ne peut proposer d'augmenter les dépenses
- Conseil constitutionnel : contrôle a priori et a posteriori (QPC)
- Critères Maastricht : déficit < 3% PIB, dette < 60% PIB
- Procédure de déficit excessif UE en cours contre la France
