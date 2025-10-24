import { AnonymizationStrategy, AnonymizationResult } from '../types';
import { v4 as uuidv4 } from 'uuid';

// --- EXPANDED DICTIONARIES (GAZETTEERS) ---
// Simulating access to a large, reliable database like the one from dane.gov.pl
const MALE_FIRST_NAMES_PL = new Set(['Piotr', 'Krzysztof', 'Andrzej', 'Tomasz', 'Paweł', 'Jan', 'Michał', 'Marcin', 'Jakub', 'Adam', 'Marek', 'Łukasz', 'Grzegorz', 'Mateusz', 'Wojciech', 'Mariusz', 'Dariusz', 'Zbigniew', 'Rafał', 'Robert', 'Kamil', 'Jacek', 'Patryk', 'Daniel', 'Maciej', 'Stanisław', 'Dawid', 'Artur', 'Sławomir', 'Sebastian', 'Mirosław', 'Przemysław', 'Cezary', 'Leszek', 'Adrian', 'Ryszard', 'Roman', 'Filip', 'Henryk', 'Damian', 'Arkadiusz', 'Bartosz', 'Kazimierz', 'Tadeusz', 'Szymon', 'Jarosław', 'Jerzy', 'Dominik', 'Kacper', 'Józef', 'Wiktor', 'Karol', 'Aleksander', 'Antoni', 'Igor', 'Franciszek', 'Mikołaj']);
const FEMALE_FIRST_NAMES_PL = new Set(['Anna', 'Katarzyna', 'Małgorzata', 'Agnieszka', 'Barbara', 'Ewa', 'Krystyna', 'Elżbieta', 'Maria', 'Magdalena', 'Joanna', 'Aleksandra', 'Monika', 'Teresa', 'Danuta', 'Natalia', 'Karolina', 'Marta', 'Beata', 'Dorota', 'Jadwiga', 'Alicja', 'Weronika', 'Julia', 'Helena', 'Zofia', 'Grażyna', 'Bożena', 'Patrycja', 'Kinga', 'Janina', 'Irena', 'Paulina', 'Justyna', 'Hanna', 'Zuzanna', 'Renata', 'Sylwia', 'Agata', 'Wiktoria', 'Izabela', 'Emilia', 'Aneta', 'Oliwia', 'Urszula', 'Klaudia', 'Gabriela', 'Martyna', 'Laura', 'Amelia', 'Antonina', 'Lena', 'Maja']);
const LAST_NAMES_PL = new Set(['Nowak', 'Wójcik', 'Kowalczyk', 'Woźniak', 'Mazur', 'Krawczyk', 'Zieliński', 'Szymański', 'Woźniak', 'Dąbrowski', 'Kozłowski', 'Jankowski', 'Wojciechowski', 'Kwiatkowski', 'Kaczmarek', 'Lewandowski', 'Grabowski', 'Piotrowski', 'Wiśniewski', 'Michalski', 'Król', 'Zając', 'Wieczorek', 'Jabłoński', 'Pawlak', 'Walczak', 'Stępień', 'Gajewski', 'Sikora', 'Witkowski', 'Rutkowski', 'Baran', 'Michalak', 'Szewczyk', 'Ostrowski', 'Tomaszewski', 'Pietrzak', 'Duda', 'Pawłowski', 'Marciniak', 'Wróbel', 'Jasiński', 'Lis', 'Mazurek', 'Kubiak', 'Kaźmierczak', 'Stasiak', 'Górecki']);
const CITIES_PL = ['Warszawa', 'Kraków', 'Gdańsk', 'Poznań', 'Wrocław', 'Łódź', 'Szczecin', 'Bydgoszcz', 'Lublin', 'Katowice'];
const STREETS_PL = ['Kwiatowa', 'Leśna', 'Słoneczna', 'Krótka', 'Szkolna', 'Ogrodowa', 'Lipowa', 'Brzozowa', 'Polna', 'Akacjowa'];

// Helper types for the new architecture
type EntityType = 'PERSON' | 'PESEL' | 'PHONE_NR' | 'EMAIL' | 'ID_CARD' | 'PASSPORT_NR' | 'BANK_ACCOUNT' | 'STREET_ADDRESS' | 'POSTAL_ADDRESS' | 'NIP' | 'LINKEDIN_PROFILE' | 'JOB_TITLE';

interface FoundEntity {
  type: EntityType;
  text: string;
  startIndex: number;
  endIndex: number;
  personId?: number; // To link PII to a person
}

interface PersonProfile {
  id: number;
  tag: string;
  names: Set<string>; // e.g., "Jan Kowalski", "Jan"
  pii: { [key in EntityType]?: Set<string> };
  replacementName?: string;
}

// Helper functions for generating random data
const getRandomElement = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomDigits = (len: number): string => Array.from({length: len}, () => Math.floor(Math.random() * 10)).join('');
const randomLetters = (len: number): string => Array.from({length: len}, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join('');


const REGEX_MAP: { [key in EntityType]?: RegExp } = {
    PERSON: /\b([A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]+)\s+([A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]+(?:-[A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]+)?)\b/g,
    PESEL: /\b\d{11}\b/g,
    PHONE_NR: /\b(?:\+?48[-\s]?)?(?:\(?\d{2,3}\)?[-\s]?)?\d{2,3}[-\s]?\d{2,3}[-\s]?\d{2,3}\b/g,
    EMAIL: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
    ID_CARD: /\b[A-Z]{3}\s?\d{6}\b/g,
    PASSPORT_NR: /\b[A-Z]{2}\d{7}\b/g,
    BANK_ACCOUNT: /\b(?:PL)?\s?\d{2}(?:[\s-]?\d{4}){6}\b/g,
    STREET_ADDRESS: /\b(ul\.|ulica|al\.|aleja|os\.|osiedle|pl\.|plac)\s[A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż\s-]+\d{1,4}([a-zA-Z]|\/\d{1,4})?\b/gi,
    POSTAL_ADDRESS: /\b\d{2}-\d{3}\s[A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż-]+\b/gi,
    NIP: /\b(?:NIP:?\s?)?\d{3}[-\s]?\d{3}[-\s]?\d{2}[-\s]?\d{2}\b/g,
    LINKEDIN_PROFILE: /linkedin\.com\/in\/[a-zA-Z0-9_-]+/gi,
    JOB_TITLE: /\b(dyrektor(?:em)?|prezes(?:em)?|asystentka|księgowy|analityk|kierownik)\b/gi,
};

// ==================================================================================
// STEP 1: SIMULATE LLM CONTEXTUAL ENTITY RECOGNITION
// This function reads the text and returns a structured list of potential PII.
// It doesn't modify the text, it only understands it.
// ==================================================================================
const simulateLlmEntityRecognition = (text: string): FoundEntity[] => {
    const foundEntities: FoundEntity[] = [];

    // Find all potential entities using regex
    for (const key in REGEX_MAP) {
        const type = key as EntityType;
        const regex = REGEX_MAP[type];
        if (!regex) continue;

        let match;
        while ((match = regex.exec(text)) !== null) {
            foundEntities.push({
                type,
                text: match[0],
                startIndex: match.index,
                endIndex: match.index + match[0].length,
            });
        }
    }

    // Sort entities by their appearance in the text
    foundEntities.sort((a, b) => a.startIndex - b.startIndex);

    // Contextual association: Link PII to persons found in the same sentence
    const personEntities = foundEntities.filter(e => e.type === 'PERSON');
    if (personEntities.length > 0) {
        const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
        let sentenceStartIndex = 0;

        sentences.forEach(sentence => {
            const sentenceEndIndex = sentenceStartIndex + sentence.length;
            const peopleInSentence = personEntities.filter(p => p.startIndex >= sentenceStartIndex && p.endIndex <= sentenceEndIndex);
            
            if (peopleInSentence.length === 1) { // Simple heuristic: associate if only one person is in the sentence
                const person = peopleInSentence[0];
                foundEntities.forEach(entity => {
                    if (entity.type !== 'PERSON' && entity.startIndex >= sentenceStartIndex && entity.endIndex <= sentenceEndIndex) {
                        // A more advanced system would create a proper graph, but for a mock, this is sufficient
                        // We will solidify this link in the profile building step.
                    }
                });
            }
            sentenceStartIndex = sentenceEndIndex;
        });
    }

    return foundEntities;
};


// ==================================================================================
// STEP 2: VERIFY LLM OUTPUT AND BUILD PROFILES
// This function takes the raw findings from the "LLM" and verifies them
// against our rules and dictionaries to create a reliable "database" of people.
// ==================================================================================
const buildVerifiedProfiles = (text: string, entities: FoundEntity[], strategy: AnonymizationStrategy): { profiles: Map<number, PersonProfile>, verifiedEntities: FoundEntity[] } => {
    const profiles = new Map<number, PersonProfile>();
    const verifiedEntities: FoundEntity[] = [];
    let personCounter = 1;
    const nameToProfileId = new Map<string, number>();

    // First pass: Identify and verify PERSON entities to create initial profiles
    entities.forEach(entity => {
        if (entity.type === 'PERSON') {
            const [firstName] = entity.text.split(' ');
            // VERIFICATION STEP: Check against our name dictionary
            if (MALE_FIRST_NAMES_PL.has(firstName) || FEMALE_FIRST_NAMES_PL.has(firstName)) {
                
                let profileId = nameToProfileId.get(entity.text);
                if (!profileId) {
                    const newProfile: PersonProfile = {
                        id: personCounter,
                        tag: `[PERSON_${personCounter}]`,
                        names: new Set([entity.text, firstName]),
                        pii: {},
                    };

                    if (strategy === AnonymizationStrategy.REPLACE) {
                        const randomFirstName = Math.random() > 0.5 ? getRandomElement(Array.from(MALE_FIRST_NAMES_PL)) : getRandomElement(Array.from(FEMALE_FIRST_NAMES_PL));
                        const randomLastName = getRandomElement(Array.from(LAST_NAMES_PL));
                        newProfile.replacementName = `${randomFirstName} ${randomLastName}`;
                    }

                    profileId = personCounter++;
                    profiles.set(profileId, newProfile);
                    nameToProfileId.set(entity.text, profileId);
                    nameToProfileId.set(firstName, profileId);
                }
                entity.personId = profileId;
                verifiedEntities.push(entity);
            }
            // If not in dictionary, it's a false positive (like "Rynek Główny") and we discard it.
        } else {
             verifiedEntities.push(entity); // Keep other PII types for now
        }
    });

    // Second pass: Associate other PII with the verified people based on context (sentence proximity)
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    let sentenceStartIndex = 0;
    sentences.forEach(sentence => {
        const sentenceEndIndex = sentenceStartIndex + sentence.length;
        
        const peopleInSentence = verifiedEntities.filter(p => p.type === 'PERSON' && p.startIndex >= sentenceStartIndex && p.endIndex <= sentenceEndIndex);
        
        if (peopleInSentence.length === 1 && peopleInSentence[0].personId) {
            const personId = peopleInSentence[0].personId;
            const profile = profiles.get(personId);
            if (profile) {
                 verifiedEntities.forEach(entity => {
                    if (entity.type !== 'PERSON' && entity.startIndex >= sentenceStartIndex && entity.endIndex <= sentenceEndIndex) {
                        entity.personId = personId; // Link this PII to the person
                        if (!profile.pii[entity.type]) {
                            profile.pii[entity.type] = new Set();
                        }
                        profile.pii[entity.type]!.add(entity.text);
                    }
                });
            }
        }
        sentenceStartIndex = sentenceEndIndex;
    });

    return { profiles, verifiedEntities };
};

// ==================================================================================
// STEP 3: PERFORM THE FINAL ANONYMIZATION
// This function uses the verified profiles and entities to replace text.
// ==================================================================================
const performFinalAnonymization = (text: string, profiles: Map<number, PersonProfile>, entities: FoundEntity[], strategy: AnonymizationStrategy): string => {
    let processedText = text;

    // Replace from the end to the beginning to keep indices valid
    entities.sort((a, b) => b.startIndex - a.startIndex).forEach(entity => {
        let replacement = '';
        const profile = entity.personId ? profiles.get(entity.personId) : undefined;
        
        switch (strategy) {
            case AnonymizationStrategy.TAG:
                replacement = profile ? profile.tag : `[${entity.type}]`;
                break;
            case AnonymizationStrategy.REMOVE:
                replacement = '[USUNIĘTO]';
                break;
            case AnonymizationStrategy.REPLACE:
                 if (profile && entity.type === 'PERSON') {
                    replacement = profile.replacementName || 'Zastępcza Osoba';
                 } else {
                    // Generic replacers for unlinked or non-person PII
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
                        default: replacement = `[${entity.type}]`; break;
                    }
                 }
                break;
        }

        processedText = processedText.slice(0, entity.startIndex) + replacement + processedText.slice(entity.endIndex);
    });

    return processedText;
}


export const mockAnonymizeApi = (
  text: string,
  strategy: AnonymizationStrategy
): Promise<AnonymizationResult> => {
  console.log(`Simulating HYBRID API call with strategy: ${strategy}`);
  
  return new Promise((resolve) => {
    setTimeout(() => {
      // --- THE NEW HYBRID PIPELINE ---
      // 1. Simulate LLM finding potential PII
      const llmOutput = simulateLlmEntityRecognition(text);
      console.log('--- Step 1: Simulated LLM Raw Output ---', llmOutput);

      // 2. Verify results and build reliable profiles
      const { profiles, verifiedEntities } = buildVerifiedProfiles(text, llmOutput, strategy);
      console.log('--- Step 2: Verified Profiles (The "Database") ---', profiles);
      
      // 3. Perform the final text replacement
      const anonymizedText = performFinalAnonymization(text, profiles, verifiedEntities, strategy);

      const result: AnonymizationResult = {
        anonymizedText: anonymizedText,
        anonymizationId: `anon_${uuidv4()}`,
      };
      resolve(result);
    }, 1500 + Math.random() * 1000);
  });
};
