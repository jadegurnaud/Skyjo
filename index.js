// Chargement des modules 
const express = require('express');
const app = express();
const http = require('http');
const server = app.listen(8080, function() {
    console.log("C'est parti ! En attente de connexion sur le port 8080...");
});

// Ecoute sur les websockets
const { Server } = require("socket.io");
const io = new Server(server);

// Configuration d'express pour utiliser le répertoire "public"
app.use(express.static('public'));
// set up to 
app.get('/', function(req, res) {  
    res.sendFile(__dirname + '/public/skyjo.html');
});

// déblocage requetes cross-origin
//io.set('origins', '*:*');

/***************************************************************
 *                      Classes
***************************************************************/
class Card{
    constructor(nb){
        this.number=nb;
        this.face=false; // face = derriere de la carte
    }

    isReturn(){
        return this.face;
    }

    value(){
        //Accès valeur que si retourné
        if(this.face==true){
            return this.number;
        }
        return null;
    }

    retourner(){
        if(this.face==true){
            this.face=false;
        }else{
            this.face=true;
        }
    }

        
}

class DeckOfCard{
    constructor(){
        this.pioche=[];
        this.defausse=[];

        for(let i = -2;i<=12;i++){
            let card;
            if(i==0){
                for(let j=0;j<15;j++){
                    card=new Card(i);
                    this.pioche.push(card);
                } 
            }else if(i==-2){
                for(let j=0;j<5;j++){
                    card=new Card(i);
                    this.pioche.push(card);
                } 
            }else{
                for(let j=0;j<10;j++){
                    card=new Card(i);
                    this.pioche.push(card);
                } 
            }
        }
    }

    getPioche(){
        return this.pioche;
    }

    getDefausse(){
        return this.defausse;
    }

    mix(){
        let j;
        let mem;
        for (let i = this.pioche.length-1; i>0; i--) {
            j = Math.floor(Math.random()*(i+1));
            mem = this.pioche[i];
            this.pioche[i] = this.pioche[j];
            this.pioche[j] = mem;
        }
    }

    distribuer(nbJoueurs){
        let tabPlateauxJoueurs = [nbJoueurs];
        
        for(let j=0;j<nbJoueurs;j++){
            tabPlateauxJoueurs[j] = [3];

            for(let i=0;i<3;i++){
                tabPlateauxJoueurs[j][i] =[4];
                for(let k=0; k<4; k++){
                    tabPlateauxJoueurs[j][i][k] = this.pioche.pop();
                }
            }
        }
        return tabPlateauxJoueurs;
    }

    mettreDansDefausse(carte){
        if(carte.isReturn()==false){
            carte.retourner();
        }
        this.defausse.push(carte);

    }

    retournerCarte(carte){
        carte.retourner();
    }

    piocherPioche(){
        let cartePioche = this.pioche.pop();
        cartePioche.retourner();
        return cartePioche;
    }

    piocherDefausse(){
        let carteDefausse = this.defausse.pop();
        return carteDefausse;
    }

    mettreDansLeJeu(l,c, plateau, carte){
        if(carte.isReturn==false){
            carte.retourner();
        }
        this.defausse.push(plateau[l][c]);
        plateau[l][c] = carte;
    }

    retournerCartesFin(plateau){
        for(let i=0;i<3;i++){
            for(let j=0; j<4; j++){
                if(plateau[i][j].isReturn()==true){
                    retournerCarte(plateau[i][j]);
                }
            }
        }
        
    }

    enleverColonnes(plateau){
        for(let j=0;j<4;j++){
            if(plateau[0][j].value==plateau[0][j].value && plateau[0][j].value==plateau[1][j].value && plateau[0][j].value==plateau[2][j].value){
                mettreDansDefausse(plateau[0][j]);
                mettreDansDefausse(plateau[1][j]);
                mettreDansDefausse(plateau[2][j]);
                plateau[0][j]==null;
                plateau[1][j]==null;
                plateau[2][j]==null;
            }
            
        }

    }

}

class Game{
    constructor(nom_partie, createur){
        this.joueurs=[];
        this.joueurs.push(createur);
        this.plateaux;
        this.joueur_courant=0;
        this.deck=new DeckOfCard();
        this.tour=1;
        this.nom=nom_partie;
        this.carte_en_main=null;  //carte en bas qu'on a pioché

        
    }

    getNom(){
        return this.nom;
    }

    getJoueurs(){
        return this.joueurs;
    }

    getNombreJoueurs(){
        return this.joueurs.length;
    }

    getJoueurCourant(){
        return this.joueurs[this.joueur_courant];
    }

    getPlateaux(){
        return this.plateaux;
    }

    getPlateauCourant(){
        return this.plateaux[this.joueur_courant];
    }

    getNbCarteRetournePlateauCourant(){
        let nb=0;
        for(let i=0;i<3;i++){
            for(let k=0; k<4; k++){
                if(this.plateaux[this.joueur_courant][i][k].isReturn()){
                    nb++;
                }   
            }
        }
        return nb;
    }

    getDeck(){
        return this.deck;
    }

    getTour(){
        return this.tour;
    }

    addJoueur(joueur){
        this.joueurs.push(joueur);
    }

    nextTour(){
        this.tour++;
    }

    piocherCarte(dansLaPioche){
        if(dansLaPioche){
            this.carte_en_main = this.deck.piocherPioche();
        }else{
            this.carte_en_main = this.deck.piocherDefausse();
        }

    }

    poserCarte(){
        this.deck.mettreDansDefausse(this.carte_en_main);
        this.carte_en_main = null;
    }

    getCarteEnMain(){
        return this.carte_en_main;
    }

    poserCarteEnMain(){
        let carte = this.carte_en_main;
        this.carte_en_main=null;
        return carte;
    }


    nextJoueurCourant(){
        if(this.joueur_courant==this.getNombreJoueurs()-1){
            this.joueur_courant=0;
            this.tour++;
        }else{
            this.joueur_courant++;
        }
    }

    initialiserLaPartie(){
        this.deck.mix();
        this.deck.mettreDansDefausse(this.deck.piocherPioche());
        this.plateaux=this.deck.distribuer(this.joueurs.length);
    }
}

class All_Game{
    constructor(){
        this.parties=[];
        this.ensemble_joueurs=[];
    }

    rechercher_partie(nom_partie) {
        for(let i = 0; i<this.parties.length;i++){
            if(this.parties[i].getNom()==nom_partie){
                return this.parties[i];
            }
        } 
        return null;
    }

    getJoueurs(){
        return this.ensemble_joueurs;
    }

    getParties(){
        return this.parties;
    }

    addJoueur(joueur, partie){
        this.ensemble_joueurs.push(joueur);
        this.rechercher_partie(partie).addJoueur(joueur);
    }

    addPartie(nom_partie, createur){
        this.ensemble_joueurs.push(createur);
        this.parties.push(new Game(nom_partie, createur));
    }


}


/**************************************************************
 *                      Fonctions
 *************************************************************/





/***************************************************************
 *           Gestion des joueurs et des connexions
***************************************************************/

let all_game = new All_Game();
let clients = {};



/**
 *  Supprime les infos associées à l'utilisateur passé en paramètre.
 *  @param  string  id  l'identifiant de l'utilisateur à effacer
 */
function supprimer(id) {
    delete clients[id];
}



/***************************************************************
 *                 Rejoindre / Créer une partie
 ***************************************************************/

// Quand un joueur se connecte, on le note dans la console
io.on('connection', function (socket) {
    
    // message de debug
    console.log("Un joueur s'est connecté");
    var currentID = null;
    
    /**
     *  Connexion d'un joueur
     *  @param  id  string  l'identifiant saisi par le client
     */
    socket.on("login", function(partie) {  

        // Vérification pseudo
        if (all_game.getJoueurs()[partie.joueur]) {
            socket.emit("erreur-connexion", "Le pseudo est déjà pris.");
            return;
        }
        
        /**
         * Gestion partie
         */

        let partie_en_cours = all_game.rechercher_partie(partie.nom);

        //Si nouvelle partie
        if(partie.nouvelle==true){
            //vérifie qu'elle existe pas
            if(partie_en_cours!=null){
                socket.emit("erreur-connexion", "Le nom de la partie est déjà pris.");
                return;
            }

            //ajout si c'est bon
            all_game.addPartie(partie.nom, partie.joueur);
            partie_en_cours = all_game.rechercher_partie(partie.nom);
            socket.emit("nouvelle-partie",partie.nom);
        }

        //Si rejoindre partie
        else{
            //vérifie qu'elle existe
            if(partie_en_cours==null){
                socket.emit("erreur-connexion", "Le nom de la partie n'existe pas.");
                return;
            }


            //ajout du joueur à la partie, si moins de 5 joueurs
            if(partie_en_cours.getNombreJoueurs() < 5){
                partie_en_cours.addJoueur(partie.joueur);
            }else{
                socket.emit("erreur-connexion", "Trop de joueurs dans la partie");
                return;
            }
            
        }
        
        //envoie nom du joueur qui vient de se connecter + ensemble des joueurs
        // sinon on récupère son ID
        currentID = partie.joueur;
        // initialisation
        clients[currentID] = socket;
        // log
        console.log("Nouveau joueur : " + currentID);
        
        io.sockets.emit("connexion-joueur", {joueur_en_cours : currentID, joueurs_partie : partie_en_cours.getJoueurs(), nomPartie : partie.nom});
        
    });

    /************************************************************************
     *                      Demarrage partie
     ***********************************************************************/

    //Initialisation de la partie
    socket.on("lancerPartie", function(nomPartie){
        console.log("--->  Début de la partie");
        //création des plateaux + distribution des cartes 
        let partie_a_lancer = all_game.rechercher_partie(nomPartie);
        partie_a_lancer.initialiserLaPartie();

        //envoie des paquets de cartes, des joueurs et des plateaux à tous les joueurs
        io.sockets.emit("evolution-partie", {joueurs : partie_a_lancer.getJoueurs(), deck : partie_a_lancer.getDeck(), plateaux : partie_a_lancer.getPlateaux(), joueur_courant : partie_a_lancer.getJoueurCourant(), carte : partie_a_lancer.getCarteEnMain()});

        //envoie d'un message au joueur qui commence
        console.log("joueur : "+partie_a_lancer.getJoueurCourant());
        clients[partie_a_lancer.getJoueurCourant()].emit("retourner-2-cartes", {joueurs : partie_a_lancer.getJoueurs(), plateaux : partie_a_lancer.getPlateaux()});
    });


    socket.on("piocherCarte", function(data){
        let partie_en_cours = all_game.rechercher_partie(data.nomPartie);
        console.log("--->  Piocher une carte : "+partie_en_cours.getJoueurCourant());
        
        if(data.dansLaPioche==true){
            partie_en_cours.piocherCarte(true);
        }else{
            partie_en_cours.piocherCarte(false);
        }
        let carte = partie_en_cours.getCarteEnMain();
        io.sockets.emit("evolution-partie",{joueurs : partie_en_cours.getJoueurs(), deck : partie_en_cours.getDeck(), plateaux : partie_en_cours.getPlateaux(), joueur_courant : partie_en_cours.getJoueurCourant(), carte : partie_en_cours.getCarteEnMain()});
        clients[partie_en_cours.getJoueurCourant()].emit("utiliser-la-carte", {joueurs : partie_en_cours.getJoueurs(), deck : partie_en_cours.getDeck(), plateaux : partie_en_cours.getPlateaux(), joueur_courant : partie_en_cours.getJoueurCourant(), carte : partie_en_cours.getCarteEnMain()});
    });

    socket.on("retournerCarte", function(data){
        let partie_en_cours = all_game.rechercher_partie(data.nomPartie);
        console.log("--->  Retourner une carte : "+partie_en_cours.getJoueurCourant());
        
        let plateau = partie_en_cours.getPlateaux()[data.indice_plateau];
  
        partie_en_cours.getDeck().retournerCarte(plateau[data.ligne][data.colonne]);


        //Si premier tour et 2 cartes retournées
        if(partie_en_cours.getTour()==1){
            console.log("       -->  carte début");
            //Si joueur courant a 2 cartes retournée
            if(partie_en_cours.getNbCarteRetournePlateauCourant()==2){
                partie_en_cours.nextJoueurCourant();
                //Si on vient de terminer le tour 1
                if(partie_en_cours.getTour()==2){
                    io.sockets.emit("evolution-partie",{joueurs : partie_en_cours.getJoueurs(), deck : partie_en_cours.getDeck(), plateaux : partie_en_cours.getPlateaux(), joueur_courant : partie_en_cours.getJoueurCourant(), carte : partie_en_cours.getCarteEnMain()});
                    clients[partie_en_cours.getJoueurCourant()].emit("a-vous-de-joueur", {joueurs : partie_en_cours.getJoueurs(), deck : partie_en_cours.getDeck(), plateaux : partie_en_cours.getPlateaux(), joueur_courant : partie_en_cours.getJoueurCourant(), carte : partie_en_cours.getCarteEnMain()});
                    return;
                }
            }
            io.sockets.emit("evolution-partie",{joueurs : partie_en_cours.getJoueurs(), deck : partie_en_cours.getDeck(), plateaux : partie_en_cours.getPlateaux(), joueur_courant : partie_en_cours.getJoueurCourant(), carte : partie_en_cours.getCarteEnMain()});
            clients[partie_en_cours.getJoueurCourant()].emit("retourner-2-cartes", {joueurs : partie_en_cours.getJoueurs(), plateaux : partie_en_cours.getPlateaux()});
        }else{
            //Retourne la carte et au joueur suivant (car on a mis la carte dans la défausse)
            if(partie_en_cours.getCarteEnMain()==null){
                console.log("       -->  carte jeu");
                partie_en_cours.nextJoueurCourant();
                io.sockets.emit("evolution-partie",{joueurs : partie_en_cours.getJoueurs(), deck : partie_en_cours.getDeck(), plateaux : partie_en_cours.getPlateaux(), joueur_courant : partie_en_cours.getJoueurCourant(), carte : partie_en_cours.getCarteEnMain()});
                clients[partie_en_cours.getJoueurCourant()].emit("a-vous-de-joueur", {joueurs : partie_en_cours.getJoueurs(), deck : partie_en_cours.getDeck(), plateaux : partie_en_cours.getPlateaux(), joueur_courant : partie_en_cours.getJoueurCourant(), carte : partie_en_cours.getCarteEnMain()});
                return;
            //S'il veut inverser sa carte pioché avec celle du jeu
            }else{
                let carte_du_jeu=partie_en_cours.getPlateauCourant()[data.ligne][data.colonne];
                let carte_en_main=partie_en_cours.getCarteEnMain();

                partie_en_cours.getPlateauCourant()[data.ligne][data.colonne]=carte_en_main;
                partie_en_cours.poserCarte(carte_du_jeu);
            }
        }
    });


    socket.on("defausserCarte", function(data){
        let partie_en_cours = all_game.rechercher_partie(data.nomPartie);
        console.log("--->  Defausser une carte : "+partie_en_cours.getJoueurCourant());
        partie_en_cours.poserCarte();

        io.sockets.emit("evolution-partie",{joueurs : partie_en_cours.getJoueurs(), deck : partie_en_cours.getDeck(), plateaux : partie_en_cours.getPlateaux(), joueur_courant : partie_en_cours.getJoueurCourant(), carte : partie_en_cours.getCarteEnMain()});
        clients[partie_en_cours.getJoueurCourant()].emit("retourner-une-carte-de-votre-jeu", {joueurs : partie_en_cours.getJoueurs(), deck : partie_en_cours.getDeck(), plateaux : partie_en_cours.getPlateaux(), joueur_courant : partie_en_cours.getJoueurCourant(), carte : partie_en_cours.getCarteEnMain()});
    });

    socket.on("remplacerCarte", function(data){
        let partie_en_cours = all_game.rechercher_partie(data.nomPartie);
        console.log("--->  Echanger la carte : "+partie_en_cours.getJoueurCourant());

        partie_en_cours.getDeck().mettreDansLeJeu(data.ligne,data.colonne,partie_en_cours.getPlateauCourant(),partie_en_cours.poserCarteEnMain())

        partie_en_cours.nextJoueurCourant();
        io.sockets.emit("evolution-partie",{joueurs : partie_en_cours.getJoueurs(), deck : partie_en_cours.getDeck(), plateaux : partie_en_cours.getPlateaux(), joueur_courant : partie_en_cours.getJoueurCourant(), carte : partie_en_cours.getCarteEnMain()});
        clients[partie_en_cours.getJoueurCourant()].emit("a-vous-de-joueur", {joueurs : partie_en_cours.getJoueurs(), deck : partie_en_cours.getDeck(), plateaux : partie_en_cours.getPlateaux(), joueur_courant : partie_en_cours.getJoueurCourant(), carte : partie_en_cours.getCarteEnMain()});
    });
    

    

    socket.on("classement", function(partie){
        //parcours pour trouver la partie
        //parcours plateaux partie
        //compte points pour chaque plateau
        //enregistrer les points avec pseudo assosié a leurs points
        //trier tableau ordre decroissant
        //return tableau
    });

    socket.on("rCarte", function(data){
        let plateau = partie_en_cours.getPlateaux()[data.indice_plateau];
        if(plateau.getNbCarteRetournePlateauCourant()!=12){
            plateau.retournerCartesFin();
        }
           
        plateau.enleverColonnes(plateau);

        io.sockets.emit("evolution-partie",{joueurs : partie_en_cours.getJoueurs(), deck : partie_en_cours.getDeck(), plateaux : partie_en_cours.getPlateaux(), joueur_courant : partie_en_cours.getJoueurCourant(), carte : null});
         
    });



    /*************************************************************
     *                   Chat
     ************************************************************/

    /**
     *  Réception d'un message et transmission à tous.
     *  @param  msg     Object  le message à transférer à tous  
     */
    socket.on("message", function(msg) {
        console.log("Reçu message");   
        // si message privé, envoi seulement au destinataire
        if (msg.to != null) {
            if (clients[msg.to] !== undefined) {
                console.log(" --> message privé");
                clients[msg.to].emit("message", { from: currentID, to: msg.to, text: msg.text, date: Date.now() });
                if (currentID != msg.to) {
                    socket.emit("message", { from: currentID, to: msg.to, text: msg.text, date: Date.now() });
                }
            }
            else {
                socket.emit("message", { from: null, to: currentID, text: "Utilisateur " + msg.to + " inconnu", date: Date.now() });
            }
        }
        // sinon, envoi à tous les gens connectés
        else {
            console.log(" --> broadcast");
            io.sockets.emit("message", { from: currentID, to: null, text: msg.text, date: Date.now() });
        }
    });

    

    /*************************************************************
     *                  Gestion des déconnexions
     ************************************************************/
    
    // fermeture
    socket.on("logout", function() { 
        // si client était identifié (devrait toujours être le cas)
        if (currentID) {
            console.log("Sortie de l'utilisateur " + currentID);

            // envoi de l'information de déconnexion
            socket.broadcast.emit("message", 
                { from: null, to: null, text: currentID + " a quitté le jeu", date: Date.now() } );
            // suppression de l'entrée
            supprimer(currentID);
            // désinscription du client
            currentID = null;
        }
    });
    
    // déconnexion de la socket
    socket.on("disconnect", function(reason) { 
        // si client était identifié
        if (currentID) {
            // envoi de l'information de déconnexion
            socket.broadcast.emit("message", 
                { from: null, to: null, text: currentID + " vient de se déconnecter de l'application", date: Date.now() } );
            // suppression de l'entrée
            supprimer(currentID);
            // désinscription du client
            currentID = null;
        }
        socket.emit("deconnexion");
        console.log("Client déconnecté");
    });
});