// Nomes por país para gerar jogadores mais imersivos.
// Fallback para "Brasil" quando o país não estiver mapeado.

export const POS_LABEL: Record<string, string> = {
  GOL: "Goleiro",
  ZAG: "Zagueiro",
  LAT: "Lateral",
  VOL: "Volante",
  MEI: "Meia",
  ATA: "Atacante",
};

type NameSet = { first: string[]; last: string[] };

export const NAMES_BY_COUNTRY: Record<string, NameSet> = {
  Brasil: {
    first: ["Gabriel", "Lucas", "Matheus", "Bruno", "Rafael", "Pedro", "João", "Felipe", "Diego", "Rodrigo", "Thiago", "Vinícius", "Everton", "Wesley", "Danilo", "Léo", "Marcos", "André", "Caio", "Igor", "Renan", "Vitor", "Douglas", "Éder"],
    last: ["Silva", "Souza", "Costa", "Pereira", "Oliveira", "Santos", "Rodrigues", "Almeida", "Nascimento", "Lima", "Araújo", "Ribeiro", "Carvalho", "Gomes", "Martins", "Rocha", "Melo", "Barbosa", "Cardoso", "Correia", "Teixeira"],
  },
  Argentina: {
    first: ["Lionel", "Ángel", "Julián", "Lautaro", "Rodrigo", "Nicolás", "Enzo", "Alexis", "Gonzalo", "Cristian", "Emiliano", "Franco", "Nahuel", "Thiago", "Facundo", "Mateo"],
    last: ["Martínez", "González", "Fernández", "López", "Díaz", "Romero", "Sosa", "Álvarez", "Acosta", "Benítez", "Molina", "Paredes", "Ruiz", "Herrera", "Suárez"],
  },
  Inglaterra: {
    first: ["Harry", "Jack", "James", "Jude", "Phil", "Marcus", "Declan", "Bukayo", "Mason", "Reece", "Jordan", "Kyle", "Trent", "Callum", "Ollie", "Cole"],
    last: ["Smith", "Jones", "Taylor", "Brown", "Wilson", "Walker", "Foden", "Bellingham", "Rice", "Kane", "Saka", "Stones", "Grealish", "Rashford", "Maddison"],
  },
  Espanha: {
    first: ["Sergio", "Pablo", "Pedri", "Gavi", "Álvaro", "Marco", "Dani", "Ferran", "Rodri", "Mikel", "Iker", "Nico", "Fabián", "Bryan", "Fermín"],
    last: ["García", "Martín", "López", "Sánchez", "Ruiz", "Torres", "Ramos", "Olmo", "Merino", "Morata", "Fabián", "Gavira", "Baena", "Cubarsí", "Yamal"],
  },
  Itália: {
    first: ["Marco", "Lorenzo", "Alessandro", "Federico", "Nicolò", "Gianluca", "Matteo", "Sandro", "Ciro", "Leonardo", "Davide", "Andrea", "Giacomo", "Riccardo"],
    last: ["Rossi", "Russo", "Ferrari", "Esposito", "Bianchi", "Romano", "Barella", "Chiesa", "Tonali", "Scamacca", "Raspadori", "Frattesi", "Locatelli", "Dimarco"],
  },
  Alemanha: {
    first: ["Leon", "Kai", "Joshua", "Jamal", "Timo", "Thomas", "Serge", "Florian", "Niklas", "Julian", "Leroy", "Antonio", "Maximilian", "Robin"],
    last: ["Müller", "Schmidt", "Wirtz", "Havertz", "Kimmich", "Sané", "Werner", "Wagner", "Rüdiger", "Gnabry", "Goretzka", "Musiala", "Füllkrug", "Andrich"],
  },
  França: {
    first: ["Kylian", "Antoine", "Ousmane", "Aurélien", "Eduardo", "Théo", "Randal", "Marcus", "Ibrahima", "Jules", "Adrien", "Bradley", "Warren", "Michael"],
    last: ["Mbappé", "Dembélé", "Griezmann", "Tchouaméni", "Camavinga", "Coman", "Hernández", "Thuram", "Konaté", "Koundé", "Saliba", "Rabiot", "Zaïre-Emery", "Barcola"],
  },
  Portugal: {
    first: ["Cristiano", "Bruno", "Bernardo", "Rúben", "Diogo", "João", "Gonçalo", "Rafael", "Vitinha", "Nuno", "André", "Pedro", "Ricardo", "Otávio"],
    last: ["Silva", "Fernandes", "Dias", "Leão", "Neves", "Ramos", "Cancelo", "Félix", "Palhinha", "Costa", "Vitinha", "Horta", "Inácio", "Semedo"],
  },
  Holanda: {
    first: ["Virgil", "Frenkie", "Memphis", "Cody", "Denzel", "Nathan", "Xavi", "Tijjani", "Jerdy", "Wout", "Donyell", "Steven", "Micky", "Jurriën"],
    last: ["van Dijk", "de Jong", "Depay", "Gakpo", "Dumfries", "Aké", "Simons", "Reijnders", "Schouten", "Weghorst", "Malen", "Bergwijn", "van de Ven", "Timber"],
  },
  Uruguai: {
    first: ["Federico", "Darwin", "Ronald", "Facundo", "Nicolás", "Rodrigo", "Manuel", "Sebastián", "Matías", "Maximiliano", "José", "Agustín"],
    last: ["Valverde", "Núñez", "Araújo", "Pellistri", "de la Cruz", "Bentancur", "Ugarte", "Cáceres", "Viña", "Olivera", "Giménez", "Rodríguez"],
  },
  México: {
    first: ["Hirving", "Raúl", "Edson", "Santiago", "César", "Guillermo", "Jesús", "Luis", "Orbelín", "Uriel", "Roberto", "Carlos"],
    last: ["Lozano", "Jiménez", "Álvarez", "Giménez", "Montes", "Ochoa", "Gallardo", "Chávez", "Pineda", "Antuna", "Alvarado", "Vega"],
  },
  Bélgica: {
    first: ["Kevin", "Romelu", "Youri", "Jérémy", "Amadou", "Leandro", "Dodi", "Charles", "Thibaut", "Axel", "Arthur", "Jan"],
    last: ["De Bruyne", "Lukaku", "Tielemans", "Doku", "Onana", "Trossard", "Lukebakio", "De Ketelaere", "Courtois", "Witsel", "Theate", "Vertonghen"],
  },
  Colômbia: {
    first: ["James", "Luis", "Rafael", "Duván", "Jhon", "Juan", "Dávinson", "Yerry", "Wilmar", "Mateus", "Richard", "Jorge"],
    last: ["Rodríguez", "Díaz", "Santos", "Zapata", "Córdoba", "Cuadrado", "Sánchez", "Mina", "Barrios", "Uribe", "Ríos", "Carrascal"],
  },
  Croácia: {
    first: ["Luka", "Mateo", "Marcelo", "Ivan", "Josko", "Andrej", "Mario", "Josip", "Dominik", "Borna", "Lovro", "Nikola"],
    last: ["Modric", "Kovacic", "Brozovic", "Perisic", "Gvardiol", "Kramaric", "Pasalic", "Juranovic", "Livakovic", "Sosa", "Majer", "Vlasic"],
  },
};

export function randomName(country?: string): string {
  const set = (country && NAMES_BY_COUNTRY[country]) || NAMES_BY_COUNTRY.Brasil;
  const f = set.first[Math.floor(Math.random() * set.first.length)];
  const l = set.last[Math.floor(Math.random() * set.last.length)];
  return `${f} ${l}`;
}

export const NAME_COUNTRIES = Object.keys(NAMES_BY_COUNTRY);
