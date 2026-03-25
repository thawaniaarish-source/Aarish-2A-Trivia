import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8'
};

const questionBank = {
  science: [
    { question: 'What planet is known as the Red Planet?', choices: ['Venus', 'Mars', 'Jupiter', 'Mercury'], answerIndex: 1, explanation: 'Mars appears red because of iron oxide on its surface.' },
    { question: 'What is the chemical symbol for water?', choices: ['O2', 'H2O', 'CO2', 'NaCl'], answerIndex: 1, explanation: 'Water is made of hydrogen and oxygen: H2O.' },
    { question: 'What gas do humans breathe in to survive?', choices: ['Nitrogen', 'Hydrogen', 'Oxygen', 'Helium'], answerIndex: 2, explanation: 'Humans need oxygen for cellular respiration.' },
    { question: 'How many bones are in the adult human body?', choices: ['206', '198', '300', '151'], answerIndex: 0, explanation: 'Most adults have 206 bones.' },
    { question: 'Which part of the cell contains genetic material?', choices: ['Nucleus', 'Ribosome', 'Cell membrane', 'Cytoplasm'], answerIndex: 0, explanation: 'The nucleus stores DNA in most cells.' },
    { question: 'What force keeps planets orbiting the sun?', choices: ['Magnetism', 'Gravity', 'Friction', 'Electricity'], answerIndex: 1, explanation: 'Gravity keeps planets in orbit around the sun.' },
    { question: 'What is the boiling point of water at sea level?', choices: ['90°C', '80°C', '100°C', '120°C'], answerIndex: 2, explanation: 'At 1 atmosphere, water boils at 100°C.' },
    { question: 'What do bees collect from flowers?', choices: ['Pollen and nectar', 'Sand and water', 'Leaves and bark', 'Salt and sugar'], answerIndex: 0, explanation: 'Bees gather nectar and pollen for food and pollination.' },
    { question: 'Which organ pumps blood through the body?', choices: ['Lungs', 'Liver', 'Heart', 'Kidney'], answerIndex: 2, explanation: 'The heart pumps blood throughout the body.' },
    { question: 'What is the nearest star to Earth?', choices: ['Sirius', 'Alpha Centauri', 'The Sun', 'Polaris'], answerIndex: 2, explanation: 'Our nearest star is the Sun.' },
    { question: 'Which state of matter has a definite volume but no fixed shape?', choices: ['Solid', 'Liquid', 'Gas', 'Plasma'], answerIndex: 1, explanation: 'Liquids keep volume but take the shape of their container.' },
    { question: 'What process do plants use to make food?', choices: ['Digestion', 'Respiration', 'Photosynthesis', 'Fermentation'], answerIndex: 2, explanation: 'Plants make glucose via photosynthesis.' },
    { question: 'What is Earth’s natural satellite?', choices: ['Mars', 'Venus', 'The Moon', 'Europa'], answerIndex: 2, explanation: 'Earth has one natural satellite: the Moon.' },
    { question: 'Which blood cells help fight infection?', choices: ['Red blood cells', 'White blood cells', 'Platelets', 'Plasma cells'], answerIndex: 1, explanation: 'White blood cells are part of the immune system.' },
    { question: 'What type of energy is stored in food?', choices: ['Nuclear energy', 'Chemical energy', 'Sound energy', 'Light energy'], answerIndex: 1, explanation: 'Food stores chemical energy in molecular bonds.' }
  ],
  history: [
    { question: 'Who was the first President of the United States?', choices: ['Thomas Jefferson', 'George Washington', 'John Adams', 'James Madison'], answerIndex: 1, explanation: 'George Washington served as the first U.S. president.' },
    { question: 'In what year did World War II end?', choices: ['1942', '1945', '1939', '1950'], answerIndex: 1, explanation: 'World War II ended in 1945.' },
    { question: 'Which ancient civilization built the pyramids at Giza?', choices: ['Romans', 'Greeks', 'Egyptians', 'Mayans'], answerIndex: 2, explanation: 'The ancient Egyptians built the Giza pyramids.' },
    { question: 'Who is credited with discovering America in 1492?', choices: ['Leif Erikson', 'Christopher Columbus', 'Ferdinand Magellan', 'Marco Polo'], answerIndex: 1, explanation: 'Columbus reached the Americas in 1492.' },
    { question: 'What wall fell in 1989, symbolizing the end of the Cold War?', choices: ['Great Wall of China', 'Hadrian’s Wall', 'Berlin Wall', 'Wailing Wall'], answerIndex: 2, explanation: 'The Berlin Wall fell in November 1989.' },
    { question: 'Which empire was ruled by Julius Caesar?', choices: ['Greek Empire', 'Roman Republic', 'Ottoman Empire', 'Persian Empire'], answerIndex: 1, explanation: 'Julius Caesar was a leader in the Roman Republic.' },
    { question: 'Who wrote the Declaration of Independence?', choices: ['Benjamin Franklin', 'George Washington', 'Thomas Jefferson', 'John Hancock'], answerIndex: 2, explanation: 'Thomas Jefferson was the primary author.' },
    { question: 'The Renaissance began in which country?', choices: ['France', 'Italy', 'England', 'Spain'], answerIndex: 1, explanation: 'The Renaissance started in Italy.' },
    { question: 'Who was known as the Maid of Orléans?', choices: ['Marie Curie', 'Joan of Arc', 'Catherine the Great', 'Queen Elizabeth I'], answerIndex: 1, explanation: 'Joan of Arc is known as the Maid of Orléans.' },
    { question: 'Which ship famously sank in 1912?', choices: ['Lusitania', 'Mayflower', 'Titanic', 'Bismarck'], answerIndex: 2, explanation: 'The RMS Titanic sank in April 1912.' },
    { question: 'What was the name of the trade route linking China and the Mediterranean?', choices: ['Spice Route', 'Silk Road', 'Amber Road', 'Royal Road'], answerIndex: 1, explanation: 'The Silk Road connected East and West trade.' },
    { question: 'Who was the British prime minister during most of World War II?', choices: ['Neville Chamberlain', 'Winston Churchill', 'Clement Attlee', 'Margaret Thatcher'], answerIndex: 1, explanation: 'Winston Churchill led Britain through most of WWII.' },
    { question: 'In which year did the U.S. Civil War begin?', choices: ['1861', '1859', '1865', '1870'], answerIndex: 0, explanation: 'The Civil War began in 1861.' },
    { question: 'Which civilization created Machu Picchu?', choices: ['Aztec', 'Inca', 'Maya', 'Olmec'], answerIndex: 1, explanation: 'Machu Picchu was built by the Inca.' },
    { question: 'Who was the first woman to fly solo across the Atlantic Ocean?', choices: ['Sally Ride', 'Amelia Earhart', 'Valentina Tereshkova', 'Bessie Coleman'], answerIndex: 1, explanation: 'Amelia Earhart completed the solo flight in 1932.' }
  ],
  sports: [
    { question: 'How many players are on a soccer team on the field at one time?', choices: ['9', '10', '11', '12'], answerIndex: 2, explanation: 'Each soccer team fields 11 players.' },
    { question: 'How many points is a touchdown worth in American football?', choices: ['3', '6', '7', '2'], answerIndex: 1, explanation: 'A touchdown is worth 6 points before the extra attempt.' },
    { question: 'Which sport uses a shuttlecock?', choices: ['Tennis', 'Squash', 'Badminton', 'Pickleball'], answerIndex: 2, explanation: 'Badminton is played with a shuttlecock.' },
    { question: 'How many bases are there on a baseball field?', choices: ['3', '4', '5', '6'], answerIndex: 1, explanation: 'There are 4 bases: first, second, third, and home.' },
    { question: 'In basketball, how many points is a free throw worth?', choices: ['1', '2', '3', '4'], answerIndex: 0, explanation: 'A made free throw is worth 1 point.' },
    { question: 'What country hosts the Tour de France?', choices: ['Spain', 'Italy', 'France', 'Belgium'], answerIndex: 2, explanation: 'The Tour de France is held primarily in France.' },
    { question: 'What is the maximum score in a single frame of ten-pin bowling?', choices: ['20', '30', '40', '10'], answerIndex: 1, explanation: 'A strike followed by two strikes totals 30 in one frame.' },
    { question: 'In tennis, what is a score of zero called?', choices: ['Love', 'Nil', 'Blank', 'Zero'], answerIndex: 0, explanation: 'Zero points in tennis is called “love.”' },
    { question: 'Which sport features the terms “checkmate” and “stalemate”?', choices: ['Checkers', 'Go', 'Chess', 'Fencing'], answerIndex: 2, explanation: 'Those terms are from chess.' },
    { question: 'How long is an Olympic swimming pool?', choices: ['25 meters', '50 meters', '75 meters', '100 meters'], answerIndex: 1, explanation: 'Olympic pools are 50 meters long.' },
    { question: 'How many rings are on the Olympic flag?', choices: ['4', '5', '6', '7'], answerIndex: 1, explanation: 'The Olympic flag has 5 interlocking rings.' },
    { question: 'In golf, what is one stroke under par called?', choices: ['Bogey', 'Eagle', 'Birdie', 'Albatross'], answerIndex: 2, explanation: 'One under par is a birdie.' },
    { question: 'Which country invented judo?', choices: ['China', 'Korea', 'Japan', 'Thailand'], answerIndex: 2, explanation: 'Judo was founded in Japan by Jigoro Kano.' },
    { question: 'In volleyball, how many players are on each side of the court?', choices: ['5', '6', '7', '8'], answerIndex: 1, explanation: 'Indoor volleyball has 6 players per side.' },
    { question: 'What piece of equipment is required in ice hockey to hit the puck?', choices: ['Bat', 'Racket', 'Club', 'Stick'], answerIndex: 3, explanation: 'Players use a hockey stick to move the puck.' }
  ],
  geography: [
    { question: 'What is the largest ocean on Earth?', choices: ['Atlantic', 'Indian', 'Arctic', 'Pacific'], answerIndex: 3, explanation: 'The Pacific Ocean is the largest.' },
    { question: 'What is the capital city of Japan?', choices: ['Kyoto', 'Osaka', 'Tokyo', 'Sapporo'], answerIndex: 2, explanation: 'Tokyo is the capital of Japan.' },
    { question: 'Which continent is the Sahara Desert located on?', choices: ['Asia', 'Africa', 'Australia', 'South America'], answerIndex: 1, explanation: 'The Sahara spans much of North Africa.' },
    { question: 'Which country has the largest population as of 2026?', choices: ['China', 'India', 'United States', 'Indonesia'], answerIndex: 1, explanation: 'India remains the most populous country in 2026.' },
    { question: 'What is the longest river in the world (commonly taught answer)?', choices: ['Amazon', 'Nile', 'Yangtze', 'Mississippi'], answerIndex: 1, explanation: 'Many school references list the Nile as longest.' },
    { question: 'Which U.S. state is known as the “Sunshine State”?', choices: ['California', 'Arizona', 'Florida', 'Hawaii'], answerIndex: 2, explanation: 'Florida is nicknamed the Sunshine State.' },
    { question: 'Mount Everest lies in which mountain range?', choices: ['Andes', 'Rockies', 'Himalayas', 'Alps'], answerIndex: 2, explanation: 'Everest is part of the Himalayas.' },
    { question: 'Which country is both in Europe and Asia?', choices: ['Turkey', 'Portugal', 'Sweden', 'Ireland'], answerIndex: 0, explanation: 'Turkey spans both Europe and Asia.' },
    { question: 'What is the capital of Canada?', choices: ['Toronto', 'Ottawa', 'Vancouver', 'Montreal'], answerIndex: 1, explanation: 'Ottawa is Canada’s capital city.' },
    { question: 'Which line divides Earth into Northern and Southern Hemispheres?', choices: ['Prime Meridian', 'Tropic of Cancer', 'Equator', 'International Date Line'], answerIndex: 2, explanation: 'The Equator is the dividing line at 0° latitude.' },
    { question: 'Which continent has the most countries?', choices: ['Europe', 'Africa', 'Asia', 'South America'], answerIndex: 1, explanation: 'Africa has the highest number of sovereign states.' },
    { question: 'What is the smallest country in the world by area?', choices: ['Monaco', 'Nauru', 'Vatican City', 'San Marino'], answerIndex: 2, explanation: 'Vatican City is the smallest by land area.' },
    { question: 'The Great Barrier Reef is off the coast of which country?', choices: ['Australia', 'New Zealand', 'Philippines', 'Fiji'], answerIndex: 0, explanation: 'It lies off northeastern Australia.' },
    { question: 'Which desert is the largest hot desert on Earth?', choices: ['Gobi', 'Kalahari', 'Sahara', 'Arabian'], answerIndex: 2, explanation: 'The Sahara is the largest hot desert.' },
    { question: 'Which city is famously called the “City of Light”?', choices: ['Rome', 'Paris', 'Berlin', 'Madrid'], answerIndex: 1, explanation: 'Paris is often called the City of Light.' }
  ]
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function pickQuestion(topic) {
  const normalizedTopic = typeof topic === 'string' ? topic.toLowerCase() : 'science';
  const key = questionBank[normalizedTopic] ? normalizedTopic : 'science';
  const questions = questionBank[key];
  const randomIndex = Math.floor(Math.random() * questions.length);
  return questions[randomIndex];
}

async function handleTriviaRequest(req, res) {
  try {
    let body = '';
    for await (const chunk of req) {
      body += chunk;
    }

    const parsed = body ? JSON.parse(body) : {};
    const question = pickQuestion(parsed.topic);
    return sendJson(res, 200, question);
  } catch (error) {
    return sendJson(res, 400, { error: `Invalid request: ${error.message}` });
  }
}

async function serveStatic(req, res) {
  const requestPath = req.url === '/' ? '/index.html' : req.url;
  const filePath = join(process.cwd(), 'public', requestPath);

  try {
    const file = await readFile(filePath);
    const mimeType = MIME_TYPES[extname(filePath)] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mimeType });
    res.end(file);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
}

const server = createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/api/trivia') {
    return handleTriviaRequest(req, res);
  }

  if (req.method === 'GET') {
    return serveStatic(req, res);
  }

  res.writeHead(405, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({ error: 'Method not allowed' }));
});

server.listen(PORT, () => {
  console.log(`Trivia app running at http://localhost:${PORT}`);
});
