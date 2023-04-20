"use strict";

document.addEventListener("DOMContentLoaded", function(e) {
    /*************************************************************
     *        Passage page d'accueil aux pages de connexion
     *************************************************************/

    //Ajout listener bouton "Créer une partie"
    document.getElementById("btnCreerUnePartie").addEventListener("click", function(){
        document.getElementById("radio2").checked = true;
        document.body.setAttribute("class", "creer");
    });

    //Ajout listener bouton "Rejoindre une partie"
    document.getElementById("btnRejoindreUnePartie").addEventListener("click", function(){
        document.getElementById("radio2").checked = true;
        document.body.setAttribute("class", "rejoindre");
    });

    //Ajout listener bouton "Accueil"
    document.getElementById("btnAccueil").addEventListener("click", function(){
        document.getElementById("radio1").checked = true;
        document.body.removeAttribute("class");
    });

    /*************************************************************
     *          Passage page de connexion à la page de jeu
     *************************************************************/

    // socket ouverte vers le client
    var sock = io.connect();
        
    // utilisateur courant 
    var currentUser = null;
    var currentPartie = null;

    //Gestion des listeners
    let defaussePourPiocher = false;
    let piocheActive=false;
    let defausseActive = false;
    let carte_bas = null;



    /******************************************************** 
     *          Connexion du joueur à la partie
     *******************************************************/

    //Ajout listener bouton "Lancer / Rejoindre / Quitter la partie"
    document.getElementById("btnLancer").addEventListener("click", function(){
        connect(true);
    });
    document.getElementById("btnRejoindre").addEventListener("click", function(){
        connect(false);
    });

    function connect(nouvelle) {
        // recupération du pseudo
        var user = document.getElementById("pseudo").value.trim();
        if (! user) return;
        currentUser = user; 
        // recuperation du nom de la partie 
        var nom_partie = document.getElementById("nom_partie").value.trim();
        if (! nom_partie) return;

        // ouverture de la connexion
        sock.emit("login", {nom: nom_partie, joueur:user, nouvelle: nouvelle});
    }

    // réception d'une erreur de connexion
    sock.on("erreur-connexion", function(msg) {
        alert(msg);   
        document.getElementById("btnCreerUnePartie").value = "CREER UNE PARTIE";
        document.getElementById("btnCreerUnePartie").disabled = false;
    });


    

    sock.on("nouvelle-partie", function(nomPartie) { 
        
        document.getElementById("ext-btnCommencerPartie").style.display = "block";
        document.getElementById("btnCommencerPartie").addEventListener("click", function(){
            sock.emit("lancerPartie",nomPartie);
            document.getElementById("btnCommencerPartie").disabled = true;
            document.getElementById("ext-btnCommencerPartie").innerHTML="";
        });
    });


    //Joueur a rejoins la partie
    sock.on("connexion-joueur", function(partie) {    
        currentPartie=partie.nomPartie; 
        if (currentUser) {
            document.getElementById("radio3").checked = true;
        }
    });

    document.getElementById("btnQuitter").addEventListener("click", function(){
        quitter();
    });

    


    /*************************************************************
     *                   Elements de jeu
     ************************************************************/

    //Initialisation du jeu
    sock.on("evolution-partie", function(data) { 

        let joueurs = data.joueurs;
        let plateaux = data.plateaux;
        let pioche = data.deck.pioche;
        let defausse = data.deck.defausse;
        let joueur_courant = data.joueur_courant;
        carte_bas = data.carte;

        afficher_plateaux(joueurs, plateaux, false);
        afficher_pioche(pioche);
        afficher_defausse(defausse);
        afficher_tour_jouer(joueur_courant, false);
        afficher_carte_choisi(carte_bas);
    });

    //Le joueur doit retourner 2 cartes dans son jeu
    sock.on("retourner-2-cartes", function(data) {
        let joueurs = data.joueurs;
        let plateaux = data.plateaux;
        afficher_plateaux(joueurs, plateaux, true);
        afficher_tour_jouer(null, true);        
    });

    //Au joueur de piocher
    sock.on("a-vous-de-joueur", function(data) {

        let joueurs = data.joueurs;
        let plateaux = data.plateaux;
        let pioche = data.deck.pioche;
        let defausse = data.deck.defausse;
        let joueur_courant = data.joueur_courant;
        carte_bas = data.carte;

        afficher_plateaux(joueurs, plateaux, false);
        afficher_pioche(pioche);
        piocheActive=true;
        defausseActive=true;
        defaussePourPiocher=true;
        afficher_defausse(defausse);
        afficher_tour_jouer(joueur_courant, false);
        afficher_carte_choisi(carte_bas);
    });


    

    //Au joueur de piocher
    sock.on("utiliser-la-carte", function(data) {
        let joueurs = data.joueurs;
        let plateaux = data.plateaux;
        let pioche = data.deck.pioche;
        let defausse = data.deck.defausse;
        let joueur_courant = data.joueur_courant;
        carte_bas = data.carte;

        afficher_plateaux(joueurs, plateaux, true);
        afficher_pioche(pioche, false);
        defausseActive=true;
        defaussePourPiocher=false;
        afficher_defausse(defausse);
        afficher_tour_jouer(joueur_courant, false);
        afficher_carte_choisi(carte_bas);      
    });

    //Retourne une carte après avoir défaussé
    sock.on("retourner-une-carte-de-votre-jeu", function(data) {
        let joueurs = data.joueurs;
        let plateaux = data.plateaux;
        let pioche = data.deck.pioche;
        let defausse = data.deck.defausse;
        let joueur_courant = data.joueur_courant;
        carte_bas = data.carte;

        afficher_plateaux(joueurs, plateaux, true);
        afficher_pioche(pioche);
        afficher_defausse(defausse);
        afficher_tour_jouer(joueur_courant, false);
        afficher_carte_choisi(carte_bas);

    });
    




    /** 
     *  Affichage le tour de jouer
     */
    function afficher_tour_jouer(personne, premierTour) {

        if(premierTour){
            let div = document.getElementById("div_grille_joueur");
            let jouer = document.createElement("p");
            let texteJouer = document.createTextNode("Retournez 2 cartes!");      
            jouer.appendChild(texteJouer);
            div.appendChild(jouer);
            jouer.style.fontSize="20px";
            jouer.style.color="red";
        }else{
            let div = document.getElementById("div_grille_joueur");
            let jouer = document.createElement("p");
            let texteJouer;
            if(personne == currentUser){
                texteJouer = document.createTextNode("A vous de jouer!");
                jouer.style.color="red";
            }else{
                texteJouer = document.createTextNode(personne+" est en train de jouer");
                jouer.style.color="blue";
            }
            jouer.appendChild(texteJouer);
            div.appendChild(jouer);
            jouer.style.fontSize="20px";
        } 
    }

    /**
     * Listener defausse
     */
    document.getElementById("defausse").addEventListener("click", function(){
        if(defausseActive){
            if(defaussePourPiocher){
                sock.emit("piocherCarte", {nomPartie : currentPartie});
                piocheActive=false;
                defaussePourPiocher=false;
            }else{
                sock.emit("defausserCarte", {nomPartie : currentPartie});
            }
            defausseActive=false;
        }
    });

    /**
     * Listener pioche
     */

    document.getElementById("pioche").addEventListener("click", function(){
        if(piocheActive){
            defausseActive=false;
            defaussePourPiocher=false;
            piocheActive=false;
            sock.emit("piocherCarte", {dansLaPioche : true, nomPartie : currentPartie});
        }
    });



    
    /************************************************************
     *                  Quitter la partie
     ***********************************************************/
    function quitter() {
        if (confirm('Voulez vous vraiment nous quitter?')){
            sock.emit("logout");
            document.getElementById("radio1").checked = true;
        }
    }
    


    /** 
     *  Cliquer sur une carte du plateau
     */
    function cliquer_carte(indice_plateau, ligne, colonne) {
        if(carte_bas==null){
            sock.emit("retournerCarte", {indice_plateau : indice_plateau, ligne : ligne, colonne : colonne, nomPartie : currentPartie});
        }else{
            sock.emit("remplacerCarte", {indice_plateau : indice_plateau, ligne : ligne, colonne : colonne, nomPartie : currentPartie});
            piocheActive=false;
            defausseActive=false;
        }
    }

    /** 
     *  Affichage de la carte
     */
     function afficher_carte(carte,element) {
        
        if(carte==null){
            element.style.backgroundImage="none";
            return;
        }
        
        if(carte.face == false){
            element.style.backgroundImage="url(images/derriere_carte.png)";
            return;
        }
        switch (carte.number) {
            case -2:
                element.style.backgroundImage="url(images/skyjo_card_02.png)";
                break;
            case -1:
                element.style.backgroundImage="url(images/skyjo_card_01.png)";
                break;
            case 0:
                element.style.backgroundImage="url(images/skyjo_card_0.png)";
                break;
            case 1:
                element.style.backgroundImage="url(images/skyjo_card_1.png)";
                break;
            case 2:
                element.style.backgroundImage="url(images/skyjo_card_2.png)";
                break;
            case 3:
                element.style.backgroundImage="url(images/skyjo_card_3.png)";
                break;
            case 4:
                element.style.backgroundImage="url(images/skyjo_card_4.png)";
                break;
            case 5:
                element.style.backgroundImage="url(images/skyjo_card_5.png)";
                break;
            case 6:
                element.style.backgroundImage="url(images/skyjo_card_6.png)";
                break;
            case 7:
                element.style.backgroundImage="url(images/skyjo_card_7.png)";
                break;
            case 8:
                element.style.backgroundImage="url(images/skyjo_card_8.png)";
                break;
            case 9:
                element.style.backgroundImage="url(images/skyjo_card_9.png)";
                break;
            case 10:
                element.style.backgroundImage="url(images/skyjo_card_10.png)";
                break;
            case 11:
                element.style.backgroundImage="url(images/skyjo_card_11.png)";
                break;
            case 12:
                element.style.backgroundImage="url(images/skyjo_card_12.png)";
                break;
           
        }
    }

    /** 
     *  Affichage des plateaux
     */
    function afficher_plateaux(joueurs, plateaux, yourTurn) {
        let plateau_joueur_principal = document.querySelector("#plateauJoueur");
        plateau_joueur_principal.innerHTML="";
        let plateau_joueur = document.querySelector("#plateauxJoueurs");
        plateau_joueur.innerHTML="";
        for(let i=0; i<joueurs.length; i++){
            if(joueurs[i] == currentUser){
                
                let grille = document.createElement("table");
                grille.setAttribute("class", "grid");
                let div = document.createElement("div");
                div.setAttribute("id", "div_grille_joueur");
                div.appendChild(grille);
                plateau_joueur_principal.appendChild(div);
                let tbody = document.createElement("tbody");
                grille.appendChild(tbody);
                for (let l=0; l < 3; l++) {
                    let tr = document.createElement("tr");
                    for (let c=0; c < 4; c++) {
                        
                        let td = document.createElement("td"); 
                        td.dataset.l = l;
                        td.dataset.c = c;
                        
                        afficher_carte(plateaux[i][l][c], td);
                        if(yourTurn && plateaux[i][l][c].face==false){       //enlever pour pioche
                            td.addEventListener('click', function piocherPioche(){
                                defaussePourPiocher=false;
                                piocheActive=false;
                                cliquer_carte(i,l,c);
                            });
                        }
                        tr.appendChild(td);

                    }
                    tbody.appendChild(tr);
                }
                let pseudo = document.createElement("p");
                let textePseudo = document.createTextNode(joueurs[i]);
                pseudo.appendChild(textePseudo);
                div.appendChild(pseudo);
            }else{
                let grille = document.createElement("table");
                grille.setAttribute("class", "grid");
                let div = document.createElement("div");
                div.setAttribute("id", "div_grille");
                div.appendChild(grille);
                plateau_joueur.appendChild(div);
                let tbody = document.createElement("tbody");
                grille.appendChild(tbody);
                for (let l=0; l < 3; l++) {
                    let tr = document.createElement("tr");
                    for (let c=0; c < 4; c++) {
                        let td = document.createElement("td"); 
                        td.dataset.l = l;
                        td.dataset.c = c;
                        afficher_carte(plateaux[i][l][c],td);
                        tr.appendChild(td);
                    }
                    tbody.appendChild(tr);
                }
                let pseudo = document.createElement("p");
                let textePseudo = document.createTextNode(joueurs[i]);
                pseudo.appendChild(textePseudo);
                div.appendChild(pseudo);
                
            }
        }
    }
    
    /** 
     *  Affichage pioche
     */
    function afficher_pioche(pioche) {
        if(pioche!=null){
            afficher_carte(pioche[pioche.length-1],document.getElementById("pioche")); 
        }else{
            afficher_carte(null,document.getElementById("pioche"));
        }
    }

     /** 
     *  Affichage defausse
     */
    function afficher_defausse(defausse) {
        if(defausse!=null){
            afficher_carte(defausse[defausse.length-1],document.getElementById("defausse"));
        }else{
            afficher_carte(null,document.getElementById("defausse"));
        }
    }

     /** 
     *  Affichage carte pioché
     */
     function afficher_carte_choisi(carte) {
        afficher_carte(carte,document.getElementById("cartePioche"));
    }
    
    

    

    //recu partie commencé
    sock.on("commencer-partie", function() {

    }); 

    /*************************************************************
     *                   CHAT
     ************************************************************/

    // tous les caractères spéciaux (utile pour les remplacements et la complétion) 
    var specialChars = {
        ":smile:": "&#128578;",
        ":sad:": "&#128577;",
        ":laugh:": "&#128512;",
        ":wink:": "&#128521;",
        ":love:": "&#129392;",
        ":coeur:": "&#10084;",
        ":bisou:": "&#128536;",
        ":peur:": "&#128561;",
        ":whoa:": "&#128562;",
        ":mask:" : "&#128567;"
    }

    // réception d'un message classique
    sock.on("message", function(msg) {
        if (currentUser) {
            afficherMessage(msg);
        }
    });

    /** 
     *  Affichage des messages 
     *  @param  object  msg    { from: auteur, text: texte du message, date: horodatage (ms) }
     */
    function afficherMessage(msg) {
        // si réception du message alors que l'on est déconnecté du service
        if (!currentUser) return;   
        
        // affichage des nouveaux messages 
        var bcMessages = document.querySelector("#chat main");

        // identification de la classe à appliquer pour l'affichage
        var classe = "";        

        // cas des messages privés 
        if (msg.from != null && msg.to != null && msg.from != 0) {
            classe = "mp";  
            if (msg.from == currentUser) {
                msg.from += " [privé @" + msg.to + "]";   
            }
            else {
                msg.from += " [privé]"
            }
        }
        
        // cas des messages ayant une origine spécifique (soi-même ou le serveur)
        if (msg.from == currentUser) {
            classe = "moi";   
        }
        else if (msg.from == null) {
            classe = "system";
            msg.from = "[admin]";
        }
        
        
        // affichage de la date format ISO pour avoir les HH:MM:SS finales qu'on extrait ensuite
        var date = getLocalTime(msg.date);
        // remplacement des caractères spéciaux par des émoji
        msg.text = traiterTexte(msg.text);
        // affichage du message
        bcMessages.innerHTML += "<p class='" + classe + "'>" + date + " - " + msg.from + " : " + msg.text + "</p>"; 
        // scroll pour que le texte ajouté soit visible à l'écran
        document.querySelector("main > p:last-child").scrollIntoView();
    };

    function getLocalTime(date) {
        return (new Date(date)).toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }).substring(11);
    }
    
    
    // traitement des emojis
    function traiterTexte(txt) {
        // remplacement de quelques smileys par les :commandes: correspondantes
        txt = txt.replace(/:[-]?\)/g,':smile:');
        txt = txt.replace(/:[-]?[Dd]/g,':laugh:');
        txt = txt.replace(/;[-]?\)/g,':wink:');
        txt = txt.replace(/:[-]?[oO]/g,':whoa:');
        txt = txt.replace(/:[-]?\*/g,':bisou:');
        txt = txt.replace(/<3/g,':coeur:');
        // remplacement des :commandes: par leur caractère spécial associé 
        for (let sp in specialChars) {
            txt = txt.replace(new RegExp(sp, "gi"), specialChars[sp]);   
        }
        return txt;   
    }

    /**
     *  Envoi d'un message : 
     *      - Récupération du message dans la zone de saisie.
     *      - Identification des cas spéciaux : @pseudo ... ou /chifoumi @pseudo :choix:
     *      - Envoi au serveur via la socket
     */ 
    function envoyer() {
        
        var msg = document.getElementById("monMessage").value.trim();
        if (!msg) return;   

        // Cas des messages privés
        var to = null;
        if (msg.startsWith("@")) {
            var i = msg.indexOf(" ");
            to = msg.substring(1, i);
            msg = msg.substring(i);
        }
        
        
        // envoi
        sock.emit("message", { to: to, text: msg });
    
        // effacement de la zone de saisie
        document.getElementById("monMessage").value = "";
    }

    document.getElementById("btnEnvoyer").addEventListener("click", envoyer);


    /*************************************************************
     *                      SCORE
     ************************************************************/
    /** Récupération des informations liées au canvas */
    const canvas = document.getElementById("cvs");
    const ctx = canvas.getContext("2d"); 

    const WIDTH = canvas.width = ctx.width = window.innerWidth / 2;
    const HEIGHT = canvas.height = ctx.height = window.innerHeight / 2;
    

    /** Paramétrages basiques pour le texte */
    ctx.font = "24px courier";
    ctx.textBaseline = 'middle';
    ctx.textAlign = "center";

    // réception des scores // tableau trié de { pseudo, score }
    //affichage
    sock.on("score", function(scores) {
        ctx.font = "20px courier";
        ctx.textAlign = "left";
        scores.forEach((e, i) => {
            let txt = e.pseudo;
            let score = String(e.score);
            let j = 0;
            do {
                txt = e.pseudo + ".".repeat(j) + score;
                j++;
            }
            while (ctx.measureText(txt).width < ctx.width / 2);
            ctx.fillText(txt, ctx.width / 4, ctx.height / 2 - 100 + i * 24);
        });
    });

});