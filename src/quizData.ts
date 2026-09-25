export interface McqQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation?: string;
}

export interface BuzzerQuestion {
  question: string;
  answer: string;
  explanation?: string;
}

export interface RapidFireQuestion {
  q: string;
  a: string;
  tier: 'easy' | 'medium' | 'hard';
}

export const R1_DATA: [string, string[], number][] = [
  ["Which company developed the large language model ChatGPT?", ["OpenAI", "Google", "Microsoft", "Meta"], 0],
  ["What does 'IoT' stand for?", ["Internet of Things", "Input Output Technology", "Integrated Online Tools", "Interconnected Operating Terminals"], 0],
  ["Which emerging computing paradigm uses qubits instead of classical bits?", ["Cloud computing", "Quantum computing", "Edge computing", "Neuromorphic computing"], 1],
  ["5G is the fifth generation of what kind of network technology?", ["Wi-Fi router technology", "Fiber-optic cable technology", "Mobile/cellular network technology", "Satellite television technology"], 2],
  ["What term describes a decentralised digital ledger technology underlying cryptocurrencies?", ["Bitcoin", "Blockchain", "Cloud ledger", "Data mesh"], 1],
  ["What does 'AR' stand for in tech circles?", ["Automated Response", "Augmented Reality", "Artificial Recognition", "Analog Rendering"], 1],
  ["NPCI, India's UPI regulator body, stands for what?", ["National Public Currency Institute", "New Payment Coordination India", "National Payments Corporation of India", "National Processing Cell of India"], 2],
  ["What is the term for AI models capable of generating text, images, or audio from prompts?", ["Predictive AI", "Reactive AI", "Analytical AI", "Generative AI"], 3],
  ["Which chip company is best known for GPUs powering modern AI training?", ["Intel", "NVIDIA", "AMD", "Qualcomm"], 1],
  ["What does 'ML' commonly stand for in the context of AI?", ["Model Logic", "Machine Learning", "Managed Learning", "Meta Language"], 1],
];

export const R2_DATA: [string, string][] = [
  ["Name the metaverse-focused rebrand of Facebook's parent company.", "Meta (Meta Platforms)"],
  ["What is the term for computing that happens near the data source rather than in a centralised cloud?", "Edge computing"],
  ["Which encryption approach is expected to be broken by sufficiently powerful quantum computers, prompting research into 'post-quantum cryptography'?", "RSA / classical public-key encryption"],
  ["What is 'prompt injection' in AI security?", "Manipulating an AI model's behaviour via hidden/malicious instructions in its input"],
  ["Name the open-source AI model family released by Meta, widely used for research.", "LLaMA"],
  ["What is the term for self-executing contracts with terms written directly into blockchain code?", "Smart contracts"],
  ["Which Indian mission successfully landed near the Moon's south pole in 2023?", "Chandrayaan-3"],
  ["Name the term for a blockchain split into two separate chains after a protocol disagreement.", "Hard fork"],
  ["Name the short-range wireless technology common in contactless payments.", "NFC (Near Field Communication)"],
  ["What is a 'digital twin'?", "A virtual, real-time replica of a physical object, system, or process"],
  ["Which company's Neuralink is developing brain-computer interface implants?", "Neuralink (Elon Musk)"],
  ["What does 'DePIN' refer to, an emerging blockchain-linked infrastructure trend?", "Decentralised Physical Infrastructure Networks"],
  ["Name the term for AI systems trained to reason and act in multiple sequential steps toward a goal.", "AI agents"],
  ["What does 'AGI' stand for in AI research?", "Artificial General Intelligence"],
  ["Which country leads global 6G research trials alongside South Korea and China, and hosts Nokia/Ericsson 6G work?", "Finland (Nordic/EU-led research)"],
];

export const R3_DATA: [string, string][] = [
  ["Prepare a slide with the OpenAI 'swirl' mark (no text). What company does it belong to?", "OpenAI"],
  ["Prepare a slide/photo of a humanoid robot demo (e.g. Atlas or Optimus). Name the robot or the company behind it.", "Atlas / Optimus — Boston Dynamics / Tesla"],
  ["Prepare a slide of the hexagonal blockchain logo used by the platform that popularised smart contracts. Name it.", "Ethereum"],
  ["Prepare a slide/photo of a modern VR headset. Name the device or its maker.", "Meta Quest (Meta) or Apple Vision Pro (Apple)"],
  ["Prepare a slide with ISRO's emblem. Identify the organisation.", "Indian Space Research Organisation (ISRO)"],
  ["Prepare a slide of a solar farm beside a wind turbine. Name the broad category of technology shown.", "Renewable / green / clean energy technology"],
  ["Prepare a slide of a QR-based payment screen. Name this Indian digital payment system.", "UPI (Unified Payments Interface)"],
  ["Prepare a slide with the NVIDIA wordmark. Identify the company.", "NVIDIA"],
];

export const R4_EASY: [string, string][] = [
  ["Expand 'CPU'.", "Central Processing Unit"],
  ["Expand 'GPU'.", "Graphics Processing Unit"],
  ["What does 'VR' stand for?", "Virtual Reality"],
  ["What does 'XR' stand for, covering AR, VR and MR together?", "Extended Reality"],
  ["Name the chatbot developed by Google.", "Gemini (formerly Bard)"],
  ["What does 'LLM' stand for?", "Large Language Model"],
  ["What does 'BYOD' stand for in workplace tech policy?", "Bring Your Own Device"],
  ["What is the currency ticker of Bitcoin?", "BTC"],
  ["Name India's own indigenous navigation satellite system.", "NavIC"],
  ["What does 'UX' stand for?", "User Experience"],
];

export const R4_MEDIUM: [string, string][] = [
  ["Expand 'SDG' (used alongside green tech goals).", "Sustainable Development Goals"],
  ["What is the term for hardware that mimics the neural structure of the human brain?", "Neuromorphic computing"],
  ["What does 'CAGR' stand for (common in tech market reports)?", "Compound Annual Growth Rate"],
  ["What does 'DAO' stand for in the blockchain world?", "Decentralised Autonomous Organisation"],
  ["Expand 'CDN'.", "Content Delivery Network"],
  ["What is the term for an attack that encrypts a victim's data until a payment is made?", "Ransomware"],
  ["Expand 'OTT' (used for streaming platforms).", "Over-The-Top"],
  ["What does 'AI hallucination' refer to?", "An AI model confidently generating false or fabricated information"],
  ["Expand 'SVG', a scalable web image format.", "Scalable Vector Graphics"],
  ["What does 'ESG' stand for in sustainable tech/business?", "Environmental, Social, and Governance"],
];

export const R4_HARD: [string, string][] = [
  ["What is 'homomorphic encryption'?", "Encryption that allows computation on encrypted data without first decrypting it"],
  ["What does 'MLOps' refer to?", "Deploying, monitoring and maintaining ML models reliably in production"],
  ["What is a 'sidechain' in blockchain terminology?", "A separate blockchain linked to a main chain, allowing assets to move between the two"],
  ["What does 'RLHF' stand for in AI training?", "Reinforcement Learning from Human Feedback"],
  ["What does 'FinOps' mean in cloud computing?", "Managing and optimising cloud spending across teams"],
  ["What is 'differential privacy'?", "Adding statistical noise so individual records stay private while aggregate insight remains accurate"],
  ["What does 'SLM' stand for, a lightweight counterpart to LLMs?", "Small Language Model"],
  ["Name the term for chips designed to accelerate AI workloads.", "AI accelerators (e.g., TPUs/NPUs)"],
  ["What does 'Web3' broadly refer to?", "A decentralised, blockchain-based vision of the next generation of the internet"],
  ["What is 'quantum entanglement' used for in quantum networking?", "Linking particle states across distance for secure communication and teleportation of information"],
];

export const R5_DATA: [string, string[], number][] = [
  ["What is 'quantum supremacy'?", ["A benchmark for internet connection speed", "A quantum computer performing a task no classical computer can complete in a feasible time", "The point at which quantum computers replace all classical computers", "A quantum computer that never produces errors"], 1],
  ["The 2017 paper 'Attention Is All You Need' introduced which architecture that underpins most modern LLMs?", ["Convolutional Neural Network (CNN)", "Recurrent Neural Network (RNN)", "Transformer", "Generative Adversarial Network (GAN)"], 2],
  ["What does 'RAG' mean in the context of modern AI systems?", ["Random Access Graph", "Retrieval-Augmented Generation", "Rapid Automated Generation", "Recursive AI Gateway"], 1],
  ["What does 'CRISPR' stand for, the gene-editing technology?", ["Cellular Repair via Interspaced Signal Processing Repeats", "Coded Recombinant Injection of Synthetic Particles", "Clustered Regularly Interspaced Short Palindromic Repeats", "Computerised Rapid Scanning of Protein Repeats"], 2],
  ["What is 'knowledge distillation' in machine learning?", ["Removing bias from a training dataset", "Compressing a large trained model into a smaller, faster one that mimics it", "Encrypting a model's weights for security", "Combining two datasets into one"], 1],
  ["What is a 'zero-day' vulnerability in cybersecurity?", ["A password that has expired", "A backup that fails after zero days", "A flaw unknown to the vendor, exploited before a fix is available", "A virus that only activates at midnight"], 2],
  ["What does 'O-RAN' stand for in telecom infrastructure?", ["Optical Rapid Area Network", "Open Radio Access Network", "Online Resource Allocation Node", "Orbital Relay Antenna Network"], 1],
  ["What term describes AI models that process and reason across text, images, and audio together?", ["Unimodal AI", "Federated AI", "Multimodal AI", "Symbolic AI"], 2],
  ["What is 'federated learning'?", ["Running one model on multiple cloud servers for speed", "Training a model using only government-approved datasets", "A method of merging two AI companies' models", "Training a model across decentralised devices without sharing raw data"], 3],
  ["Which mission did India launch to boost domestic semiconductor/chip manufacturing?", ["Digital India Chip Corps", "India Semiconductor Mission (ISM)", "National Silicon Program (NSP)", "Make in India Circuits Initiative"], 1],
  ["What does the 'AI alignment problem' refer to?", ["Synchronising clocks across distributed AI training nodes", "Matching an AI model's font rendering across devices", "Ensuring an AI system's goals and behaviour stay consistent with human intent and values", "Physically aligning server racks for cooling efficiency"], 2],
  ["What does 'ASI' stand for, a hypothetical AI surpassing human intelligence across all domains?", ["Automated Systems Integration", "Advanced Semantic Indexing", "Applied Synthetic Intelligence", "Artificial Superintelligence"], 3],
];

export const TB_DATA: [string, string][] = [
  ["What does 'TPU' stand for, Google's custom AI chip?", "Tensor Processing Unit"],
  ["Name the concept of a fully immersive, persistent virtual shared space linked to VR/AR technology.", "Metaverse"],
  ["What does 'DDoS' stand for in cybersecurity?", "Distributed Denial of Service"],
  ["What is 'prompt engineering'?", "Designing effective inputs/prompts to get the best output from an AI model"],
  ["Name the term for combining classical and quantum computing resources to solve a problem.", "Hybrid quantum-classical computing"],
];

export interface RoundConfig {
  id: string;
  label: string;
  tier: 'Easy' | 'Medium' | 'Hard' | 'Mixed';
  type: 'mcq-simul' | 'buzzer' | 'rapidfire' | 'mcq-buzzer';
  scoring: { correct: number; wrong: number };
  data?: any[];
  finalistOnly?: boolean;
}

export const ROUND_CONFIGS: RoundConfig[] = [
  { id: "r1", label: "Round 1 · Trend Trivia", tier: "Easy", type: "mcq-simul", scoring: { correct: 10, wrong: 0 }, data: R1_DATA },
  { id: "r2", label: "Round 2 · Buzzer Blitz", tier: "Medium", type: "buzzer", scoring: { correct: 10, wrong: -5 }, data: R2_DATA },
  { id: "r3", label: "Round 3 · Picture This", tier: "Medium", type: "buzzer", scoring: { correct: 10, wrong: -5 }, data: R3_DATA },
  { id: "r4", label: "Round 4 · Rapid Fire", tier: "Mixed", type: "rapidfire", scoring: { correct: 10, wrong: 0 } },
  { id: "r5", label: "Round 5 · Grand Finale", tier: "Hard", type: "mcq-buzzer", scoring: { correct: 20, wrong: -10 }, data: R5_DATA, finalistOnly: true },
  { id: "tb", label: "Sudden Death", tier: "Hard", type: "buzzer", scoring: { correct: 0, wrong: 0 }, data: TB_DATA },
];
