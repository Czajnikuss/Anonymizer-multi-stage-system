import express, { Request, Response } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const port = 8000;

app.use(cors());
app.use(express.json());

// --- TYPES (mirrored from frontend) ---
enum AnonymizationStrategy {
  TAG = 'tag',
  REPLACE = 'replace',
  REMOVE = 'remove',
}

interface AnonymizationResult {
  anonymizedText: string;
  anonymizationId: string;
}

// --- ANONYMIZATION LOGIC (moved from mockApiService) ---

const MALE_FIRST_NAMES_PL = new Set(['Piotr', 'Krzysztof', 'Andrzej', 'Tomasz', 'Paweł', 'Jan', 'Michał', 'Marcin', 'Jakub', 'Adam', 'Marek', 'Łukasz', 'Grzegorz', 'Mateusz', 'Wojciech', 'Mariusz', 'Dariusz', 'Zbigniew', 'Rafał', 'Robert', 'Kamil', 'Jacek', 'Patryk', 'Daniel', 'Maciej', 'Stanisław', 'Dawid', 'Artur', 'Sławomir', 'Sebastian', 'Mirosław', 'Przemysław', 'Cezary', 'Leszek', 'Adrian', 'Ryszard', 'Roman', 'Filip', 'Henryk', 'Damian', 'Arkadiusz', 'Bartosz', 'Kazimierz', 'Tadeusz', 'Szymon', 'Jarosław', 'Jerzy', 'Dominik', 'Kacper', 'Józef', 'Wiktor', 'Karol', 'Aleksander', 'Antoni', 'Igor', 'Franciszek', 'Mikołaj']);
const FEMALE_FIRST_NAMES_PL = new Set(['Anna', 'Katarzyna', 'Małgorzata', 'Agnieszka', 'Barbara', 'Ewa', 'Krystyna', 'Elżbieta', 'Maria', 'Magdalena', 'Joanna', 'Aleksandra', 'Monika', 'Teresa', 'Danuta', 'Natalia', 'Karolina', 'Marta', 'Beata', 'Dorota', 'Jadwiga', 'Alicja', 'Weronika', 'Julia', 'Helena', 'Zofia', 'Grażyna', 'Bożena', 'Patrycja', 'Kinga', 'Janina', 'Irena', 'Paulina', 'Justyna', 'Hanna', 'Zuzanna', 'Renata', 'Sylwia', 'Agata', 'Wiktoria', 'Izabela', 'Emilia', 'Aneta', 'Oliwia', 'Urszula', 'Klaudia', 'Gabriela', 'Martyna', 'Laura', 'Amelia', 'Antonina', 'Lena', 'Maja']);
const LAST_NAMES_PL = new Set(['Nowak', 'Wójcik', 'Kowalczyk', 'Woźniak', 'Mazur', 'Krawczyk', 'Zieliński', 'Szymański', 'Woźniak', 'Dąbrowski', 'Kozłowski', 'Jankowski', 'Wojciechowski', 'Kwiatkowski', 'Kaczmarek', 'Lewandowski', 'Grabowski', 'Piotrowski', 'Wiśniewski', 'Michalski', 'Król', 'Zając', 'Wieczorek', 'Jabłoński', 'Pawlak', 'Walczak', 'Stępień', 'Gajewski', 'Sikora', 'Witkowski', 'Rutkowski', 'Baran', 'Michalak', 'Szewczyk', 'Ostrowski', 'Tomaszewski', 'Pietrzak', 'Duda', 'Pawłowski', 'Marciniak', 'Wróbel', 'Jasiński', 'Lis', 'Mazurek', 'Kubiak', 'Kaźmierczak', 'Stasiak', 'Górecki']);
const CITIES_PL = ['Warszawa', 'Kraków', 'Gdańsk', 'Poznań', 'Wrocław', 'Łódź', 'Szczecin', 'Bydgoszcz', 'Lublin', 'Katowice'];
const STREETS_PL = ['Kwiatowa', 'Leśna', 'Słoneczna', 'Krótka', 'Szkolna', 'Ogrodowa', 'Lipowa', 'Brzozowa', 'Polna', 'Akacjowa'];

type EntityType = 'PERSON' | 'PESEL' | 'PHONE_NR' | 'EMAIL' | 'ID_CARD' | 'PASSPORT_NR' | 'BANK_ACCOUNT' | 'STREET_ADDRESS' | 'POSTAL_ADDRESS' | 'NIP' | 'LINKEDIN_PROFILE' | 'JOB_TITLE' | 'DRIVING_LICENSE';

interface FoundEntity {
  type: EntityType;
  text: string;
  startIndex: number;
  endIndex: number;
  personId?: number;
}

interface PersonProfile {
  id: number;
  tag: string;
  names: Set<string>;
  pii: { [key in EntityType]?: Set<string> };
  replacementName?: string;
}

const getRandomElement = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomDigits = (len: number): string => Array.from({length: len}, () => Math.floor(Math.random() * 10)).join('');
const randomLetters = (len: number): string => Array.from({length: len}, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join('');

const REGEX_MAP: { [key in EntityType]?: RegExp } = {
    PESEL: /\b\d{11}\b/g,
    PHONE_NR: /(?:\+|tel\.\s*służbowy:\s*|prywatny:\s*)?\+?\d{1,3}[\s-]?\d{2,3}[-\s]?\d{2,3}[-\s]?\d{2,3}\b/g,
    EMAIL: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
    ID_CARD: /\b[A-Z]{3}\s?\d{6}\b/g,
    PASSPORT_NR: /\b[A-Z]{2}\d{7}\b/g,
    BANK_ACCOUNT: /\b(?:PL)?\s?\d{2}(?:[\s-]?\d{4}){6}\b/g,
    STREET_ADDRESS: /\b(ul\.|ulica|al\.|aleja|os\.|osiedle|pl\.|plac)\s[A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż\s-]+\d{1,4}([a-zA-Z]|\/\d{1,4})?\b/gi,
    POSTAL_ADDRESS: /\b\d{2}-\d{3}\s[A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż-]+\b/gi,
    NIP: /\b(?:NIP:?\s?)?\d{3}[-\s]?\d{3}[-\s]?\d{2}[-\s]?\d{2}\b/g,
    LINKEDIN_PROFILE: /linkedin\.com\/in\/[a-zA-Z0-9_-]+/gi,
    JOB_TITLE: /\b(Radcy Prawnego|Wiceprezesa ds\. Operacyjnych|Dyrektor Generalny|Dyrektor|Prezes|Asystentka|Księgowy|Analityk|Kierownik)\b/gi,
    DRIVING_LICENSE: /seria prawa jazdy:\s*\[ID_CARD\]_NR\]\/\d{2}\/\d{4}/gi,
};

const findPersonEntities = (text: string): FoundEntity[] => {
    const personEntities: FoundEntity[] = [];
    const nameRegex = /\b([A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]+)\b/g;
    let match;

    while ((match = nameRegex.exec(text)) !== null) {
        const potentialFirstName = match[1];
        if (MALE_FIRST_NAMES_PL.has(potentialFirstName) || FEMALE_FIRST_NAMES_PL.has(potentialFirstName)) {
            const nextWordMatch = text.substring(match.index + match[0].length).match(/^\s+([A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]+(?:-[A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]+)?)/);
            if (nextWordMatch) {
                const lastName = nextWordMatch[1];
                const fullName = `${potentialFirstName} ${lastName}`;
                personEntities.push({
                    type: 'PERSON',
                    text: fullName,
                    startIndex: match.index,
                    endIndex: match.index + fullName.length,
                });
            }
        }
    }
    return personEntities;
};

const simulateLlmEntityRecognition = (text: string): FoundEntity[] => {
    let foundEntities: FoundEntity[] = findPersonEntities(text);

    for (const key in REGEX_MAP) {
        const type = key as EntityType;
        const regex = REGEX_MAP[type];
        if (!regex) continue;
        let match;
        while ((match = regex.exec(text)) !== null) {
            foundEntities.push({ type, text: match[0], startIndex: match.index, endIndex: match.index + match[0].length });
        }
    }
    return foundEntities.sort((a, b) => a.startIndex - b.startIndex);
};

const buildVerifiedProfiles = (text: string, entities: FoundEntity[], strategy: AnonymizationStrategy): { profiles: Map<number, PersonProfile>, verifiedEntities: FoundEntity[] } => {
    const profiles = new Map<number, PersonProfile>();
    let personCounter = 1;
    const nameToProfileId = new Map<string, number>();

    entities.forEach(entity => {
        if (entity.type === 'PERSON') {
            const [firstName] = entity.text.split(' ');
            let profileId = nameToProfileId.get(entity.text) || nameToProfileId.get(firstName);
            if (!profileId) {
                const newProfile: PersonProfile = {
                    id: personCounter,
                    tag: `[PERSON_${personCounter}]`,
                    names: new Set([entity.text, firstName]),
                    pii: {},
                };
                if (strategy === AnonymizationStrategy.REPLACE) {
                    const randomFirstName = MALE_FIRST_NAMES_PL.has(firstName) ? getRandomElement(Array.from(MALE_FIRST_NAMES_PL)) : getRandomElement(Array.from(FEMALE_FIRST_NAMES_PL));
                    const randomLastName = getRandomElement(Array.from(LAST_NAMES_PL));
                    newProfile.replacementName = `${randomFirstName} ${randomLastName}`;
                }
                profileId = personCounter++;
                profiles.set(profileId, newProfile);
                nameToProfileId.set(entity.text, profileId);
                nameToProfileId.set(firstName, profileId);
            }
            entity.personId = profileId;
            const profile = profiles.get(profileId)!;
            profile.names.add(entity.text);
            profile.names.add(firstName);
        }
    });

    entities.forEach((entity, index) => {
        if (entity.type === 'JOB_TITLE' && index + 1 < entities.length) {
            const nextEntity = entities[index + 1];
            if (nextEntity.type === 'PERSON' && nextEntity.personId && text.substring(entity.endIndex, nextEntity.startIndex).trim() === '') {
                 const profile = profiles.get(nextEntity.personId);
                 if (profile) {
                    entity.personId = nextEntity.personId;
                 }
            }
        }
    });

    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    let sentenceStartIndex = 0;
    sentences.forEach(sentence => {
        const sentenceEndIndex = sentenceStartIndex + sentence.length;
        const peopleInSentence = entities.filter(p => p.type === 'PERSON' && p.startIndex >= sentenceStartIndex && p.endIndex <= sentenceEndIndex && p.personId);
        if (peopleInSentence.length === 1 && peopleInSentence[0].personId) {
            const personId = peopleInSentence[0].personId;
            const profile = profiles.get(personId);
            if (profile) {
                entities.forEach(entity => {
                    if (entity.startIndex >= sentenceStartIndex && entity.endIndex <= sentenceEndIndex && !entity.personId) {
                        entity.personId = personId;
                    }
                });
            }
        }
        sentenceStartIndex = sentenceEndIndex;
    });

    entities.forEach(entity => {
        if (entity.personId) {
            const profile = profiles.get(entity.personId);
            if (profile) {
                if (!profile.pii[entity.type]) profile.pii[entity.type] = new Set();
                profile.pii[entity.type]!.add(entity.text);
            }
        }
    });

    return { profiles, verifiedEntities: entities };
};

const performFinalAnonymization = (text: string, profiles: Map<number, PersonProfile>, entities: FoundEntity[], strategy: AnonymizationStrategy): string => {
    let processedText = text;
    entities.sort((a, b) => b.startIndex - a.startIndex).forEach(entity => {
        let replacement = '';
        const profile = entity.personId ? profiles.get(entity.personId) : undefined;
        switch (strategy) {
            case AnonymizationStrategy.TAG:
                replacement = profile ? profile.tag : `[${entity.type}]`;
                break;
            case AnonymizationStrategy.REMOVE:
                replacement = '';
                break;
            case AnonymizationStrategy.REPLACE:
                if (profile && entity.type === 'PERSON') {
                    replacement = profile.replacementName || 'Zastępcza Osoba';
                } else {
                    switch (entity.type) {
                        case 'PESEL': replacement = randomDigits(11); break;
                        case 'PHONE_NR': replacement = `${randomDigits(3)}-${randomDigits(3)}-${randomDigits(3)}`; break;
                        case 'EMAIL': replacement = `${randomLetters(5).toLowerCase()}@example.com`; break;
                        case 'ID_CARD': replacement = `${randomLetters(3)}${randomDigits(6)}`; break;
                        case 'PASSPORT_NR': replacement = `${randomLetters(2)}${randomDigits(7)}`; break;
                        case 'BANK_ACCOUNT': replacement = `PL${randomDigits(2)} ${randomDigits(4)} ${randomDigits(4)} ...`; break;
                        case 'STREET_ADDRESS': replacement = `ul. ${getRandomElement(STREETS_PL)} ${Math.floor(Math.random() * 150) + 1}`; break;
                        case 'POSTAL_ADDRESS': replacement = `${randomDigits(2)}-${randomDigits(3)} ${getRandomElement(CITIES_PL)}`; break;
                        case 'NIP': replacement = `${randomDigits(3)}-${randomDigits(3)}-${randomDigits(2)}-${randomDigits(2)}`; break;
                        case 'LINKEDIN_PROFILE': replacement = 'linkedin.com/in/private-profile'; break;
                        default: replacement = `[${entity.type.replace('_', ' ')}]`; break;
                    }
                }
                break;
        }
        processedText = processedText.slice(0, entity.startIndex) + replacement + processedText.slice(entity.endIndex);
    });
    return processedText.replace(/\s\s+/g, ' ').trim();
};

// --- API ENDPOINT ---
app.post('/anonymize', (req: Request, res: Response) => {
    const { text, strategy } = req.body;

    if (!text || !strategy) {
        return res.status(400).send({ error: 'Missing text or strategy in request body' });
    }
    
    console.log(`Received request for anonymization with strategy: ${strategy}`);

    const llmOutput = simulateLlmEntityRecognition(text);
    const { profiles, verifiedEntities } = buildVerifiedProfiles(text, llmOutput, strategy);
    const anonymizedText = performFinalAnonymization(text, profiles, verifiedEntities, strategy);

    console.log('--- Verified Profiles (The "Database") ---');
    console.log(profiles);

    const result: AnonymizationResult = {
        anonymizedText: anonymizedText,
        anonymizationId: `anon_${uuidv4()}`,
    };
    
    res.json(result);
});

app.listen(port, () => {
    console.log(`Backend server listening at http://localhost:${port}`);
});
