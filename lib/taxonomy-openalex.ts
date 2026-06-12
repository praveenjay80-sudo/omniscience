export interface OASubfield {
  name: string;
  topics: string[];
}

export interface OAField {
  name: string;
  subfields: OASubfield[];
}

export interface OADomain {
  name: string;
  fields: OAField[];
}

export const OPENALEX_TAXONOMY: OADomain[] = [
  {
    name: "Physical Sciences",
    fields: [
      {
        name: "Chemical Engineering",
        subfields: [
          { name: "Bioengineering", topics: ["Bioprocess Engineering", "Bioreactor Design", "Metabolic Engineering", "Bioseparations", "Enzyme Engineering", "Cell Culture Technology", "Biomass Processing", "Synthetic Biology"] },
          { name: "Catalysis", topics: ["Heterogeneous Catalysis", "Homogeneous Catalysis", "Photocatalysis", "Electrocatalysis", "Catalytic Kinetics", "Industrial Catalysis", "Catalyst Characterization", "Nanocatalysis"] },
          { name: "Chemical Health and Safety", topics: ["Process Safety", "Hazardous Materials Handling", "Toxicology in Chemical Engineering", "Risk Assessment", "Occupational Exposure", "Safety Management Systems"] },
          { name: "Filtration and Separation", topics: ["Distillation", "Membrane Separation", "Liquid-Liquid Extraction", "Adsorption", "Crystallization", "Ion Exchange", "Chromatographic Separation", "Evaporation"] },
          { name: "Fluid Flow and Transfer Processes", topics: ["Heat Transfer", "Mass Transfer", "Fluid Mechanics", "Transport Phenomena", "Reactor Engineering", "Computational Fluid Dynamics", "Rheology", "Multiphase Flow"] },
          { name: "Process Chemistry and Technology", topics: ["Process Design", "Process Optimization", "Process Simulation", "Green Chemistry", "Scale-Up Methods", "Process Integration", "Plant Design", "Chemical Plant Operations"] },
        ],
      },
      {
        name: "Chemistry",
        subfields: [
          { name: "Analytical Chemistry", topics: ["Chromatography", "Mass Spectrometry", "Electroanalytical Chemistry", "Spectroscopic Methods", "Separations Science", "Bioanalytical Chemistry", "Environmental Analysis", "Sensor Development"] },
          { name: "Electrochemistry", topics: ["Electrode Kinetics", "Batteries and Energy Storage", "Fuel Cells", "Corrosion Science", "Electrocatalysis", "Electrodeposition", "Photoelectrochemistry", "Electrochemical Sensing"] },
          { name: "Inorganic Chemistry", topics: ["Transition Metal Chemistry", "Main Group Chemistry", "Coordination Chemistry", "Organometallic Chemistry", "Bioinorganic Chemistry", "Solid State Inorganic Chemistry", "Cluster Compounds", "f-Block Chemistry"] },
          { name: "Organic Chemistry", topics: ["Organic Synthesis", "Reaction Mechanisms", "Stereochemistry", "Natural Product Chemistry", "Medicinal Chemistry", "Organocatalysis", "Total Synthesis", "Asymmetric Synthesis"] },
          { name: "Physical and Theoretical Chemistry", topics: ["Quantum Chemistry", "Molecular Dynamics", "Chemical Kinetics", "Statistical Thermodynamics", "Computational Chemistry", "Density Functional Theory", "Molecular Spectroscopy", "Surface Chemistry"] },
          { name: "Spectroscopy", topics: ["NMR Spectroscopy", "Infrared and Raman Spectroscopy", "UV-Vis Spectroscopy", "X-ray Spectroscopy", "EPR Spectroscopy", "Fluorescence Spectroscopy", "Time-Resolved Spectroscopy", "Mass Spectrometry"] },
        ],
      },
      {
        name: "Computer Science",
        subfields: [
          { name: "Artificial Intelligence", topics: ["Machine Learning", "Deep Learning", "Reinforcement Learning", "Natural Language Processing", "Knowledge Representation and Reasoning", "Planning and Search", "Multi-Agent Systems", "Expert Systems", "Generative Models", "AI Safety and Alignment"] },
          { name: "Computational Theory and Mathematics", topics: ["Computational Complexity Theory", "Algorithm Design and Analysis", "Automata Theory", "Formal Language Theory", "Computability Theory", "Randomized Algorithms", "Approximation Algorithms", "Communication Complexity"] },
          { name: "Computer Graphics and Computer-Aided Design", topics: ["Rendering and Rasterization", "Ray Tracing", "Geometric Modeling", "Physically Based Simulation", "Character Animation", "Real-Time Graphics", "Procedural Generation", "CAD Systems"] },
          { name: "Computer Networks and Communications", topics: ["Network Protocols", "Internet Architecture", "Wireless Communications", "Mobile Networking", "Software-Defined Networking", "Network Security", "Quality of Service", "Internet of Things"] },
          { name: "Computer Science Applications", topics: ["Bioinformatics", "Medical Informatics", "Geographic Information Systems", "Educational Technology", "Computational Social Science", "E-Commerce Systems", "Scientific Computing", "Digital Libraries"] },
          { name: "Computer Vision and Pattern Recognition", topics: ["Image Classification", "Object Detection", "Semantic Segmentation", "Image Generation", "3D Scene Understanding", "Medical Image Analysis", "Video Analysis", "Face Recognition"] },
          { name: "Hardware and Architecture", topics: ["Processor Architecture", "Cache and Memory Hierarchy", "GPU Architecture", "Parallel Computing", "VLSI Design", "Embedded Systems", "Power and Energy Management", "Neuromorphic Computing"] },
          { name: "Human-Computer Interaction", topics: ["User Interface Design", "Usability and User Experience", "Accessibility", "Virtual and Augmented Reality", "Social Computing", "Tangible Interfaces", "Gesture and Touch Interaction", "Affective Computing"] },
          { name: "Information Systems", topics: ["Database Management Systems", "Information Retrieval", "Knowledge Management", "Enterprise Systems", "Business Intelligence", "Decision Support Systems", "Data Warehousing", "Information Security"] },
          { name: "Signal Processing", topics: ["Digital Signal Processing", "Image and Video Processing", "Audio and Speech Processing", "Compressed Sensing", "Wavelet Theory", "Adaptive Filtering", "Statistical Signal Processing", "Communications Signal Processing"] },
          { name: "Software", topics: ["Programming Languages", "Compilers and Interpreters", "Operating Systems", "Software Engineering", "Software Testing and Verification", "Software Architecture", "Distributed Systems", "DevOps and Continuous Delivery"] },
        ],
      },
      {
        name: "Earth and Planetary Sciences",
        subfields: [
          { name: "Atmospheric Science", topics: ["Atmospheric Dynamics", "Atmospheric Chemistry", "Climate Dynamics", "Cloud Physics", "Tropical Meteorology", "Numerical Weather Prediction", "Boundary Layer Meteorology", "Atmospheric Radiation"] },
          { name: "Earth-Surface Processes", topics: ["Geomorphology", "Sediment Transport", "Fluvial Geomorphology", "Coastal Processes", "Aeolian Processes", "Hillslope Processes", "Landscape Evolution", "Glacial Processes"] },
          { name: "Economic Geology", topics: ["Ore Deposit Geology", "Petroleum Geology", "Hydrothermal Systems", "Mineral Exploration", "Basin Analysis", "Coal Geology", "Resource Assessment", "Mining Geology"] },
          { name: "Geochemistry and Petrology", topics: ["Isotope Geochemistry", "Igneous Petrology", "Metamorphic Petrology", "Sedimentary Geochemistry", "Organic Geochemistry", "Geochemical Modeling", "Cosmochemistry", "Aqueous Geochemistry"] },
          { name: "Geology", topics: ["Structural Geology", "Mineralogy", "Volcanology", "Tectonics", "Regional Geology", "Geological Mapping", "Applied Geology", "Crystallography"] },
          { name: "Geophysics", topics: ["Seismology", "Geomagnetism", "Geodesy", "Gravity Surveys", "Electromagnetic Methods", "Seismic Tomography", "Exploration Geophysics", "Planetary Geophysics"] },
          { name: "Geotechnical Engineering and Engineering Geology", topics: ["Soil Mechanics", "Rock Mechanics", "Foundation Engineering", "Slope Stability", "Tunneling", "Ground Improvement", "Geotechnical Site Investigation", "Earthquake Geotechnics"] },
          { name: "Oceanography", topics: ["Physical Oceanography", "Chemical Oceanography", "Biological Oceanography", "Ocean Circulation", "Marine Biogeochemistry", "Deep Sea Research", "Paleoceanography", "Coastal Oceanography"] },
          { name: "Paleontology", topics: ["Vertebrate Paleontology", "Invertebrate Paleontology", "Paleobotany", "Micropaleontology", "Paleoecology", "Biostratigraphy", "Evolutionary Paleobiology", "Taphonomy"] },
          { name: "Planetary Science", topics: ["Planetary Geology", "Planetary Atmospheres", "Solar System Dynamics", "Small Body Science", "Astrobiology", "Mars Science", "Lunar Science", "Planetary Formation"] },
          { name: "Space and Planetary Science", topics: ["Space Physics", "Magnetospheres", "Solar-Terrestrial Relations", "Solar Wind", "Cosmic Rays", "Space Weather", "Exoplanet Atmospheres", "Heliosphere"] },
          { name: "Stratigraphy", topics: ["Lithostratigraphy", "Biostratigraphy", "Chronostratigraphy", "Sequence Stratigraphy", "Chemostratigraphy", "Cyclostratigraphy", "Geochronology", "Quaternary Stratigraphy"] },
        ],
      },
      {
        name: "Energy",
        subfields: [
          { name: "Energy Engineering and Power Technology", topics: ["Electrical Power Systems", "Turbine Technology", "Energy Storage Systems", "Smart Grids", "Power Electronics", "District Energy", "Energy Conversion", "Combined Heat and Power"] },
          { name: "Fuel Technology", topics: ["Combustion Science", "Biofuels", "Synthetic Fuels", "Hydrogen Production", "Natural Gas Processing", "Coal Technology", "Fuel Cell Technology", "Petrochemicals"] },
          { name: "Nuclear Energy and Engineering", topics: ["Nuclear Reactor Design", "Reactor Physics", "Thermal Hydraulics", "Nuclear Fuel Cycle", "Fusion Energy", "Nuclear Waste Management", "Radiation Safety", "Nuclear Materials"] },
          { name: "Renewable Energy, Sustainability and the Environment", topics: ["Solar Energy", "Wind Energy", "Hydropower", "Geothermal Energy", "Ocean Energy", "Energy Policy", "Life Cycle Assessment", "Grid Integration of Renewables"] },
        ],
      },
      {
        name: "Engineering",
        subfields: [
          { name: "Aerospace Engineering", topics: ["Aerodynamics", "Propulsion Systems", "Spacecraft Design", "Flight Mechanics", "Astrodynamics", "Structural Mechanics (Aerospace)", "Avionics", "UAV Engineering"] },
          { name: "Automotive Engineering", topics: ["Vehicle Dynamics", "Internal Combustion Engines", "Electric Vehicles", "Automotive Control Systems", "Vehicle Safety", "Automotive Aerodynamics", "Powertrain Engineering", "Advanced Driver Assistance"] },
          { name: "Biomedical Engineering", topics: ["Biomechanics", "Medical Imaging Engineering", "Neural Engineering", "Tissue Engineering", "Drug Delivery Systems", "Biosensors and Diagnostics", "Biomaterials", "Wearable Health Devices"] },
          { name: "Civil and Structural Engineering", topics: ["Structural Analysis", "Structural Dynamics", "Geotechnical Engineering", "Transportation Engineering", "Water Resources Engineering", "Bridge Engineering", "Earthquake Engineering", "Construction Management"] },
          { name: "Computational Mechanics", topics: ["Finite Element Analysis", "Computational Fluid Dynamics", "Multiscale Modeling", "Meshfree Methods", "Structural Optimization", "Damage Mechanics", "Computational Contact Mechanics"] },
          { name: "Control and Systems Engineering", topics: ["Classical Control Theory", "Modern Control Theory", "Robust Control", "Adaptive Control", "Process Control", "Mechatronics", "State Estimation", "Nonlinear Control"] },
          { name: "Electrical and Electronic Engineering", topics: ["Circuit Theory", "Electromagnetism", "Power Systems", "Microelectronics", "Signal Processing", "Communications Engineering", "VLSI Design", "Power Electronics"] },
          { name: "Industrial and Manufacturing Engineering", topics: ["Lean Manufacturing", "Production Planning", "Human Factors and Ergonomics", "Quality Engineering", "Manufacturing Systems", "Automation and Robotics", "Supply Chain Engineering", "Six Sigma"] },
          { name: "Mechanical Engineering", topics: ["Solid Mechanics", "Thermodynamics", "Fluid Mechanics", "Heat Transfer", "Machine Design", "Manufacturing Processes", "Robotics and Automation", "Vibration and Dynamics"] },
          { name: "Mechanics of Materials", topics: ["Elasticity", "Plasticity", "Fracture Mechanics", "Composite Materials Mechanics", "Fatigue Analysis", "Continuum Mechanics", "Viscoelasticity", "Micromechanics"] },
          { name: "Ocean Engineering", topics: ["Offshore Structures", "Marine Hydrodynamics", "Ship Hydrodynamics", "Coastal Engineering", "Underwater Vehicles", "Ocean Energy Systems", "Marine Pipelines and Risers", "Mooring Systems"] },
          { name: "Safety, Risk, Reliability and Quality", topics: ["Reliability Engineering", "Risk Assessment and Management", "Safety Engineering", "Fault Tree Analysis", "Quality Management", "Human Reliability Analysis", "Probabilistic Risk Assessment", "Systems Safety"] },
        ],
      },
      {
        name: "Environmental Science",
        subfields: [
          { name: "Ecology", topics: ["Population Ecology", "Community Ecology", "Ecosystem Ecology", "Biodiversity Science", "Food Webs", "Biogeography", "Conservation Biology", "Landscape Ecology"] },
          { name: "Environmental Chemistry", topics: ["Pollutant Fate and Transport", "Environmental Toxicology", "Atmospheric Chemistry", "Aquatic Chemistry", "Soil Chemistry", "Green Chemistry", "Remediation Chemistry", "Analytical Environmental Chemistry"] },
          { name: "Environmental Engineering", topics: ["Wastewater Treatment", "Air Pollution Control", "Solid Waste Management", "Groundwater Remediation", "Environmental Monitoring Systems", "Green Building Engineering", "Water Treatment Technology"] },
          { name: "Global and Planetary Change", topics: ["Climate Change Science", "Sea Level Rise", "Global Carbon Cycle", "Land Use Change", "Biodiversity Crisis", "Ocean Acidification", "Permafrost and Cryosphere", "Tipping Points"] },
          { name: "Health, Toxicology and Mutagenesis", topics: ["Ecotoxicology", "Human Health Risk Assessment", "Endocrine Disruption", "Mutagenicity Testing", "Bioaccumulation and Biomagnification", "Exposure Assessment", "Dose-Response Relationships"] },
          { name: "Management, Monitoring, Policy and Law", topics: ["Environmental Policy", "Environmental Law", "Environmental Impact Assessment", "Sustainability Governance", "Green Economy", "International Environmental Agreements", "Environmental Economics"] },
          { name: "Nature and Landscape Conservation", topics: ["Habitat Conservation", "Protected Area Management", "Landscape Ecology", "Ecological Restoration", "Invasive Species Management", "Wildlife Management", "Conservation Genetics"] },
          { name: "Pollution", topics: ["Air Pollution", "Water Pollution", "Soil Contamination", "Plastic Pollution", "Heavy Metal Contamination", "Noise Pollution", "Emerging Contaminants", "Urban Pollution"] },
          { name: "Waste Management and Disposal", topics: ["Solid Waste Management", "Hazardous Waste Treatment", "Wastewater Management", "Landfill Engineering", "Circular Economy", "Waste-to-Energy", "Recycling and Recovery", "E-Waste Management"] },
          { name: "Water Science and Technology", topics: ["Hydrology", "Groundwater Science", "Surface Water Hydrology", "Water Treatment Technology", "Water Quality Assessment", "Water Resource Management", "Irrigation Science", "Stormwater Management"] },
        ],
      },
      {
        name: "Materials Science",
        subfields: [
          { name: "Biomaterials", topics: ["Biocompatibility and Biointerfaces", "Implant Design and Development", "Tissue Engineering Scaffolds", "Drug Delivery Materials", "Biopolymers", "Biodegradable Materials", "Hydrogels", "Surface Biofunctionalization"] },
          { name: "Ceramics and Composites", topics: ["Structural Ceramics", "Functional Ceramics", "Ceramic Processing", "Glass Science", "Fiber-Reinforced Composites", "Nanocomposites", "Ceramic Matrix Composites", "Refractory Materials"] },
          { name: "Electronic, Optical and Magnetic Materials", topics: ["Semiconductors", "Magnetic Materials", "Optical Materials", "Ferroelectrics and Piezoelectrics", "Superconductors", "Photovoltaic Materials", "LED and Display Materials", "Quantum Materials"] },
          { name: "Materials Chemistry", topics: ["Synthesis Methods", "Surface Chemistry", "Thin Film Deposition", "Crystal Growth", "Nanomaterial Synthesis", "Metal-Organic Frameworks", "Self-Assembly", "Materials Characterization"] },
          { name: "Metals and Alloys", topics: ["Physical Metallurgy", "Steels and Iron Alloys", "Light Alloys", "Refractory Metals", "Shape Memory Alloys", "Superalloys", "Welding and Joining", "Corrosion of Metals"] },
          { name: "Polymers and Plastics", topics: ["Polymer Synthesis", "Polymer Physics and Mechanics", "Polymer Processing", "Hydrogels", "Conjugated Polymers", "Block Copolymers", "Bioplastics", "Polymer Blends"] },
          { name: "Surfaces, Coatings and Films", topics: ["Thin Films", "Tribology", "Protective Coatings", "2D Materials", "Adhesion Science", "Self-Assembled Monolayers", "Hard Coatings", "Wetting and Dewetting"] },
        ],
      },
      {
        name: "Mathematics",
        subfields: [
          { name: "Algebra and Number Theory", topics: ["Group Theory", "Ring Theory", "Field Theory", "Galois Theory", "Algebraic Number Theory", "Analytic Number Theory", "Module Theory", "Representation Theory", "Homological Algebra", "Category Theory"] },
          { name: "Analysis", topics: ["Real Analysis", "Complex Analysis", "Functional Analysis", "Harmonic Analysis", "Measure Theory", "Fourier Analysis", "Operator Theory", "Distribution Theory", "Nonlinear Analysis"] },
          { name: "Applied Mathematics", topics: ["Fluid Dynamics", "Mathematical Biology", "Mathematical Finance", "Continuum Mechanics", "Control Theory", "Operations Research", "Perturbation Methods", "Mathematical Epidemiology"] },
          { name: "Computational Mathematics", topics: ["Finite Element Methods", "Numerical Linear Algebra", "Spectral Methods", "Monte Carlo Methods", "Symbolic Computation", "Error Analysis", "Parallel Numerical Methods", "Numerical Optimization"] },
          { name: "Control and Optimization", topics: ["Optimal Control", "Convex Optimization", "Nonlinear Optimization", "Stochastic Control", "Dynamic Programming", "Variational Methods", "Integer Programming", "Robust Optimization"] },
          { name: "Discrete Mathematics and Combinatorics", topics: ["Graph Theory", "Combinatorics", "Coding Theory", "Cryptography", "Combinatorial Optimization", "Ramsey Theory", "Matroid Theory", "Extremal Combinatorics"] },
          { name: "Geometry and Topology", topics: ["Differential Geometry", "Algebraic Topology", "Riemannian Geometry", "Symplectic Geometry", "Low-Dimensional Topology", "Algebraic Geometry", "Geometric Analysis", "Knot Theory"] },
          { name: "Logic", topics: ["Mathematical Logic", "Set Theory", "Model Theory", "Proof Theory", "Type Theory", "Intuitionistic Logic", "Descriptive Set Theory", "Categorical Logic"] },
          { name: "Mathematical Physics", topics: ["Quantum Mechanics (Mathematical)", "Statistical Mechanics (Mathematical)", "Classical Mechanics (Mathematical)", "Quantum Field Theory (Mathematical)", "General Relativity (Mathematical)", "Spectral Theory", "Integrable Systems"] },
          { name: "Modeling and Simulation", topics: ["Differential Equation Modeling", "Agent-Based Models", "Stochastic Simulation", "System Dynamics", "Complex Systems Modeling", "Computational Fluid Dynamics Models", "Climate Modeling"] },
          { name: "Numerical Analysis", topics: ["Numerical Methods for ODEs", "Numerical Methods for PDEs", "Numerical Linear Algebra", "Approximation Theory", "Numerical Integration and Quadrature", "Multigrid Methods", "Numerical Stability"] },
          { name: "Statistics and Probability", topics: ["Probability Theory", "Statistical Inference", "Bayesian Statistics", "Stochastic Processes", "Time Series Analysis", "Multivariate Statistics", "Nonparametric Statistics", "High-Dimensional Statistics"] },
          { name: "Theoretical Computer Science", topics: ["Computational Complexity", "Algorithm Design", "Cryptography (Theoretical)", "Quantum Computing Theory", "Randomized Computation", "Interactive Proofs", "Approximation Complexity", "Circuit Complexity"] },
        ],
      },
      {
        name: "Physics and Astronomy",
        subfields: [
          { name: "Acoustics and Ultrasonics", topics: ["Physical Acoustics", "Architectural Acoustics", "Underwater Acoustics", "Medical Ultrasonics", "Noise and Vibration", "Acousto-Optics", "Phononic Crystals", "Ultrasonic Imaging"] },
          { name: "Astronomy and Astrophysics", topics: ["Stellar Astrophysics", "Galactic Astronomy", "Extragalactic Astronomy", "Cosmology", "Exoplanet Science", "High Energy Astrophysics", "Multi-Messenger Astronomy", "Solar Physics"] },
          { name: "Atomic and Molecular Physics, and Optics", topics: ["Quantum Optics", "Laser Physics", "Atomic Structure and Spectroscopy", "Molecular Spectroscopy", "Ultracold Atoms and Quantum Gases", "Photonics", "Nonlinear Optics", "Biophotonics"] },
          { name: "Condensed Matter Physics", topics: ["Superconductivity", "Topological Materials", "Magnetism", "Strongly Correlated Systems", "Soft Matter Physics", "Semiconductor Physics", "Quantum Hall Effect", "Nanoscale Physics"] },
          { name: "Instrumentation", topics: ["Particle Detectors", "Astronomical Instrumentation", "Precision Measurement", "Sensor Technology", "Metrology", "Interferometry", "Cryogenic Instrumentation", "X-ray Instrumentation"] },
          { name: "Nuclear and High Energy Physics", topics: ["Quantum Chromodynamics", "Electroweak Theory", "Nuclear Structure", "Heavy Ion Physics", "Neutrino Physics", "Beyond Standard Model", "Collider Physics", "Particle Detector Physics"] },
          { name: "Radiation", topics: ["Radiation Physics", "Dosimetry", "Radiation Protection", "Radioactive Decay", "Synchrotron Radiation", "X-ray Physics", "Gamma-ray Physics", "Radiation Biology"] },
          { name: "Statistical and Nonlinear Physics", topics: ["Statistical Mechanics", "Phase Transitions and Critical Phenomena", "Chaos Theory", "Complex Systems", "Pattern Formation", "Nonlinear Dynamics", "Disordered Systems", "Active Matter"] },
          { name: "Surfaces and Interfaces", topics: ["Surface Science", "Thin Film Physics", "Tribology", "Wetting and Adhesion", "Surface Catalysis", "2D Materials Physics", "Epitaxy", "Nanoscale Interfaces"] },
        ],
      },
    ],
  },
  {
    name: "Social Sciences",
    fields: [
      {
        name: "Arts and Humanities",
        subfields: [
          { name: "Archaeology", topics: ["Prehistoric Archaeology", "Classical Archaeology", "Medieval Archaeology", "Environmental Archaeology", "Archaeological Theory", "Digital Archaeology", "Underwater Archaeology", "Bioarchaeology"] },
          { name: "Conservation", topics: ["Heritage Conservation", "Materials Conservation", "Preventive Conservation", "Digital Preservation", "Conservation Ethics", "Conservation Science", "Architectural Conservation", "Museum Studies"] },
          { name: "Cultural Studies", topics: ["Cultural Theory", "Media and Popular Culture", "Postcolonial Studies", "Memory Studies", "Globalisation and Culture", "Subcultures", "Digital Culture", "Cultural Policy"] },
          { name: "History", topics: ["Ancient History", "Medieval History", "Early Modern History", "Modern History", "Social History", "Economic History", "Historiography", "Global History"] },
          { name: "Language and Linguistics", topics: ["Phonetics and Phonology", "Morphology and Syntax", "Semantics", "Pragmatics", "Historical Linguistics", "Sociolinguistics", "Psycholinguistics", "Computational Linguistics"] },
          { name: "Literature and Literary Theory", topics: ["Literary Theory", "Fiction and Narrative Theory", "Poetry Studies", "Drama Studies", "Postcolonial Literature", "Feminist Literary Criticism", "World Literature", "Digital Humanities"] },
          { name: "Music", topics: ["Music Theory", "Music History", "Ethnomusicology", "Music Psychology", "Music Performance Studies", "Music Technology", "Popular Music Studies", "Music Education"] },
          { name: "Philosophy", topics: ["Metaphysics", "Epistemology", "Ethics", "Philosophy of Mind", "Political Philosophy", "Philosophy of Science", "Logic", "Aesthetics"] },
          { name: "Religious Studies and Theology", topics: ["Comparative Religion", "Christian Theology", "Islamic Studies", "Buddhist Studies", "Philosophy of Religion", "Ritual Studies", "Secularization", "New Religious Movements"] },
          { name: "Visual Arts and Performing Arts", topics: ["Art History", "Painting and Drawing", "Sculpture", "Theater and Performance", "Film Studies", "Photography Studies", "Dance Studies", "Video and New Media Art"] },
        ],
      },
      {
        name: "Business, Management and Accounting",
        subfields: [
          { name: "Accounting", topics: ["Financial Accounting", "Managerial Accounting", "Auditing", "Taxation", "Forensic Accounting", "Accounting Information Systems", "International Accounting Standards", "Earnings Management"] },
          { name: "Business and International Management", topics: ["International Business Strategy", "Multinational Corporations", "Cross-Cultural Management", "Foreign Direct Investment", "Global Strategy", "Entry Mode Decisions", "Emerging Markets Management"] },
          { name: "Industrial Relations", topics: ["Labor Economics", "Collective Bargaining", "Trade Unions", "Employment Law", "Workplace Conflict Resolution", "Industrial Democracy", "Labor History", "Work and Employment Relations"] },
          { name: "Management Information Systems", topics: ["Enterprise Systems", "IT Strategy", "Digital Transformation", "Information Security Management", "Business Intelligence", "Knowledge Management Systems", "E-Commerce", "Digital Innovation"] },
          { name: "Management of Technology and Innovation", topics: ["Innovation Management", "Technology Strategy", "R&D Management", "Technology Transfer", "Open Innovation", "Disruptive Innovation", "New Product Development", "Technology Roadmapping"] },
          { name: "Marketing", topics: ["Consumer Behavior", "Brand Management", "Marketing Strategy", "Digital Marketing", "Market Research", "Pricing Strategy", "Services Marketing", "B2B Marketing"] },
          { name: "Organizational Behavior and Human Resource Management", topics: ["Leadership", "Motivation and Job Design", "Organizational Culture", "Talent Management", "Performance Management", "Change Management", "Team Dynamics", "Diversity and Inclusion"] },
          { name: "Strategy and Management", topics: ["Competitive Strategy", "Corporate Strategy", "Business Models", "Dynamic Capabilities", "Resource-Based View", "Strategic Alliances", "Corporate Governance", "Strategic Leadership"] },
          { name: "Tourism, Leisure and Hospitality Management", topics: ["Tourism Management", "Hospitality Operations", "Tourism Policy", "Sustainable Tourism", "Events Management", "Cultural Tourism", "Sports and Recreation Management"] },
        ],
      },
      {
        name: "Decision Sciences",
        subfields: [
          { name: "Information Systems and Management", topics: ["IT Governance", "Digital Business Strategy", "IT-Business Alignment", "Enterprise Architecture", "IT Risk Management", "Digital Ecosystems", "Platform Management"] },
          { name: "Management Science and Operations Research", topics: ["Linear Programming", "Integer Programming", "Simulation Modeling", "Queuing Theory", "Network Optimization", "Stochastic Modeling", "Multi-Criteria Decision Making", "Game Theory"] },
          { name: "Statistics, Probability and Uncertainty", topics: ["Bayesian Statistics", "Decision Theory", "Risk Analysis", "Fuzzy Logic", "Probabilistic Modeling", "Statistical Decision Theory", "Uncertainty Quantification"] },
        ],
      },
      {
        name: "Economics, Econometrics and Finance",
        subfields: [
          { name: "Economics and Econometrics", topics: ["Microeconomics", "Macroeconomics", "Development Economics", "Labor Economics", "Public Economics", "International Trade", "Behavioral Economics", "Causal Inference and Econometrics"] },
          { name: "Finance", topics: ["Asset Pricing", "Corporate Finance", "Financial Markets and Microstructure", "Banking", "Derivatives and Risk Management", "Investment Management", "Financial Econometrics", "Behavioral Finance"] },
        ],
      },
      {
        name: "Psychology",
        subfields: [
          { name: "Applied Psychology", topics: ["Industrial-Organizational Psychology", "Health Psychology", "Educational Psychology", "Forensic Psychology", "Sports Psychology", "Counseling Psychology", "Environmental Psychology"] },
          { name: "Clinical Psychology", topics: ["Psychopathology", "Evidence-Based Treatments", "Cognitive Behavioral Therapy", "Psychodynamic Therapy", "Neuropsychological Assessment", "Health and Illness Psychology", "Child and Adolescent Clinical Psychology"] },
          { name: "Developmental and Educational Psychology", topics: ["Cognitive Development", "Lifespan Development", "Language Acquisition", "Social Development", "Learning and Instruction", "Adolescent Development", "Aging and Development"] },
          { name: "Experimental and Cognitive Psychology", topics: ["Attention and Perception", "Memory and Learning", "Decision Making and Judgment", "Language Processing", "Executive Function", "Cognitive Neuroscience", "Consciousness"] },
          { name: "Neuropsychology and Physiological Psychology", topics: ["Brain-Behavior Relations", "Neuroimaging Methods", "Behavioral Neuroscience", "Psychophysiology", "Biological Bases of Behavior", "Neurological Disorders (Psychological)", "Stress and the Brain"] },
          { name: "Social Psychology", topics: ["Attitudes and Persuasion", "Social Cognition", "Group Dynamics", "Prosocial Behavior", "Intergroup Relations and Prejudice", "Social Identity", "Aggression", "Conformity and Obedience"] },
        ],
      },
      {
        name: "Social Sciences",
        subfields: [
          { name: "Communication", topics: ["Mass Communication", "Media Effects", "Political Communication", "Interpersonal Communication", "Science Communication", "Digital Media Studies", "Journalism Studies", "Organizational Communication"] },
          { name: "Cultural Studies", topics: ["Cultural Theory", "Media and Popular Culture", "Postcolonial Studies", "Intersectionality", "Globalization and Identity", "Race and Ethnicity Studies", "Queer Theory", "Material Culture"] },
          { name: "Demography", topics: ["Population Dynamics", "Fertility and Mortality", "Migration Studies", "Population Aging", "Demographic Methods", "Historical Demography", "Global Population Trends", "Urban Demography"] },
          { name: "Development", topics: ["Development Economics", "Poverty and Inequality", "International Aid and Development Finance", "Development Policy and Institutions", "Sustainable Development Goals", "Rural Development", "Decolonial Development Theory"] },
          { name: "Education", topics: ["Curriculum and Instruction", "Educational Psychology", "Higher Education", "Special Education", "Educational Technology", "Comparative Education", "Teacher Education", "Assessment in Education"] },
          { name: "Gender Studies", topics: ["Feminist Theory", "Gender and Society", "Intersectionality", "Sexuality and Queer Theory", "Masculinity Studies", "Gender and Work", "Reproductive Justice", "Transnational Feminism"] },
          { name: "Geography, Planning and Development", topics: ["Urban Planning", "Regional Development", "Transportation Planning", "Environmental Planning", "Land Use Policy", "GIS and Spatial Analysis", "Economic Geography", "Geopolitics"] },
          { name: "Health (Social Science)", topics: ["Medical Sociology", "Health Policy and Systems", "Global Health", "Social Determinants of Health", "Health Inequalities", "Sociology of Mental Health", "Disability Studies", "Health Behavior"] },
          { name: "Law", topics: ["Constitutional Law", "Criminal Law", "International Law", "Human Rights Law", "Commercial Law", "Jurisprudence and Legal Theory", "Comparative Law", "Environmental Law"] },
          { name: "Library and Information Sciences", topics: ["Information Organization and Cataloging", "Digital Libraries", "Information Behavior", "Archives and Records Management", "Knowledge Organization", "Bibliometrics and Scientometrics", "Scholarly Communication"] },
          { name: "Linguistics and Language", topics: ["Phonetics and Phonology", "Syntax and Morphology", "Semantics and Pragmatics", "Language Acquisition", "Historical and Comparative Linguistics", "Sociolinguistics", "Language Policy", "Cognitive Linguistics"] },
          { name: "Political Science and International Relations", topics: ["Comparative Politics", "International Relations Theory", "Political Theory", "Public Policy Analysis", "Electoral Studies", "Security Studies", "International Political Economy", "Political Behavior"] },
          { name: "Safety Research", topics: ["Occupational Safety", "Traffic and Road Safety", "Industrial Safety Management", "Risk Perception", "Human Factors in Safety", "Safety Culture", "Disaster Risk Reduction"] },
          { name: "Sociology and Political Science", topics: ["Social Theory", "Social Stratification and Inequality", "Political Sociology", "Economic Sociology", "Cultural Sociology", "Social Movements", "Sociology of Organizations", "Urban Sociology"] },
          { name: "Transportation", topics: ["Transportation Planning", "Traffic Engineering", "Transportation Economics", "Public Transit Systems", "Sustainable Mobility", "Freight and Logistics", "Transportation Safety", "Autonomous Vehicles"] },
          { name: "Urban Studies", topics: ["Urban Theory", "Urban Planning and Design", "Housing Markets and Policy", "Urban Economy", "Urban Sociology", "Smart Cities", "Urban Sustainability", "Gentrification and Displacement"] },
        ],
      },
    ],
  },
  {
    name: "Health Sciences",
    fields: [
      {
        name: "Dentistry",
        subfields: [
          { name: "Dental Assisting", topics: ["Clinical Dental Assisting Procedures", "Dental Radiography", "Dental Office Management", "Patient Care in Dentistry", "Infection Control in Dental Practice", "Dental Materials (Clinical)"] },
          { name: "Dental Hygiene", topics: ["Oral Prophylaxis and Scaling", "Periodontal Hygiene Therapy", "Preventive Dentistry", "Community Oral Health", "Patient Education and Communication", "Dental Pharmacology (Hygiene)"] },
          { name: "Dental Technology", topics: ["Fixed Prosthodontic Fabrication", "Removable Prosthetics Fabrication", "Dental Ceramics and Porcelain", "Digital Dentistry and CAD/CAM", "Orthodontic Appliance Fabrication", "Implant Prosthodontics Technology"] },
          { name: "Oral Surgery", topics: ["Dentoalveolar Surgery", "Oral and Maxillofacial Surgery", "Implant Surgery", "Cleft Lip and Palate Repair", "Oral Pathological Lesions", "Facial Trauma Surgery", "Preprosthetic Surgery"] },
          { name: "Orthodontics", topics: ["Biomechanics of Tooth Movement", "Malocclusion Classification", "Fixed Appliance Design", "Clear Aligner Therapy", "Skeletal Correction", "Retention and Relapse", "Growth Modification"] },
          { name: "Periodontics", topics: ["Periodontal Disease Pathogenesis", "Periodontal Surgery", "Implant Dentistry and Peri-implant Disease", "Guided Bone and Tissue Regeneration", "Gingival Recession Treatment", "Supportive Periodontal Therapy"] },
          { name: "Radiology and Imaging", topics: ["Intraoral Radiography", "Panoramic Imaging", "Cone Beam CT (CBCT)", "Digital Radiography", "Radiographic Interpretation", "Radiation Safety in Dentistry", "3D Imaging in Dentistry"] },
        ],
      },
      {
        name: "Health Professions",
        subfields: [
          { name: "Chiropody", topics: ["Foot Biomechanics", "Nail and Skin Pathologies", "Orthotic Devices", "Diabetic Foot Care", "Podiatric Surgery", "Footwear Assessment and Modification"] },
          { name: "Emergency Medical Services", topics: ["Emergency Patient Assessment", "Prehospital Trauma Care", "Advanced Life Support", "Emergency Pharmacology", "Mass Casualty Management", "Pediatric Emergency Care", "EMS Systems and Policy"] },
          { name: "Health Information Management", topics: ["Medical Coding (ICD/CPT)", "Electronic Health Records", "Health Data Analytics", "Clinical Documentation Improvement", "Privacy and Security in Health Data", "Health Informatics"] },
          { name: "Medical Laboratory Technology", topics: ["Clinical Chemistry", "Hematology Laboratory", "Clinical Microbiology", "Immunology and Serology Laboratory", "Blood Banking and Transfusion", "Urinalysis", "Laboratory Quality Management"] },
          { name: "Occupational Therapy", topics: ["Activities of Daily Living Rehabilitation", "Neurological OT", "Pediatric Occupational Therapy", "Mental Health OT", "Assistive Technology", "Occupational Science", "Ergonomics and Work Rehabilitation"] },
          { name: "Optometry", topics: ["Refractive Error and Correction", "Contact Lens Practice", "Binocular Vision and Strabismus", "Ocular Disease Management", "Low Vision Rehabilitation", "Pediatric Optometry", "Ocular Pharmacology"] },
          { name: "Pharmacy", topics: ["Pharmacokinetics", "Pharmacodynamics", "Drug Interactions", "Pharmaceutical Care", "Clinical Pharmacy Practice", "Pharmacy Compounding", "Drug Policy and Regulation"] },
          { name: "Physical Therapy, Sports Therapy and Rehabilitation", topics: ["Musculoskeletal Physiotherapy", "Neurological Rehabilitation", "Sports Injury Rehabilitation", "Exercise Prescription", "Manual Therapy", "Cardiorespiratory Physiotherapy", "Pediatric Physical Therapy"] },
          { name: "Radiological and Ultrasound Technology", topics: ["Diagnostic Radiography", "Computed Tomography (Technology)", "MRI Technology", "Ultrasound Imaging", "Nuclear Medicine Technology", "Radiation Therapy Technology", "Fluoroscopy"] },
          { name: "Respiratory Therapy", topics: ["Mechanical Ventilation", "Pulmonary Function Testing", "Airway Management", "Respiratory Pharmacology", "Cardiopulmonary Rehabilitation", "Neonatal Respiratory Care", "Critical Care Respiratory Therapy"] },
          { name: "Speech and Hearing", topics: ["Speech-Language Pathology", "Audiology and Hearing Rehabilitation", "Voice Disorders", "Fluency Disorders", "Aphasia and Acquired Language Disorders", "Augmentative and Alternative Communication", "Child Language Disorders"] },
        ],
      },
      {
        name: "Medicine",
        subfields: [
          { name: "Anatomy", topics: ["Gross Anatomy", "Neuroanatomy", "Histology", "Embryology", "Radiological Anatomy", "Surgical Anatomy", "Comparative Anatomy"] },
          { name: "Anesthesiology and Pain Medicine", topics: ["General Anesthesia", "Regional and Neuraxial Anesthesia", "Chronic Pain Management", "Critical Care Anesthesia", "Pediatric Anesthesia", "Neuro-anesthesia", "Anesthetic Pharmacology"] },
          { name: "Cardiology and Cardiovascular Medicine", topics: ["Coronary Artery Disease", "Heart Failure", "Cardiac Arrhythmias", "Valvular Heart Disease", "Interventional Cardiology", "Cardiac Imaging", "Electrophysiology"] },
          { name: "Critical Care and Intensive Care Medicine", topics: ["ICU Management", "Mechanical Ventilation (ICU)", "Sepsis and Septic Shock", "ARDS", "Multi-Organ Failure", "Critical Care Pharmacology", "Nutrition in Critical Care"] },
          { name: "Dermatology", topics: ["Inflammatory Skin Diseases", "Skin Cancer", "Dermatological Infections", "Contact Dermatitis", "Autoimmune Skin Disease", "Cosmetic Dermatology", "Pediatric Dermatology"] },
          { name: "Emergency Medicine", topics: ["Trauma and Emergency Surgery", "Acute Cardiac Emergencies", "Toxicology and Poisoning", "Resuscitation", "Emergency Procedures", "Pediatric Emergency Medicine", "Mass Casualty Management"] },
          { name: "Endocrinology, Diabetes and Metabolism", topics: ["Diabetes Mellitus", "Thyroid Disease", "Adrenal Disease", "Pituitary Disorders", "Metabolic Syndrome and Obesity", "Calcium and Bone Metabolism", "Lipid Disorders"] },
          { name: "Epidemiology", topics: ["Study Design and Bias", "Biostatistics in Epidemiology", "Infectious Disease Epidemiology", "Chronic Disease Epidemiology", "Pharmacoepidemiology", "Genetic Epidemiology", "Epidemiological Methods"] },
          { name: "Family Practice", topics: ["Primary Care Medicine", "Chronic Disease Management", "Preventive Medicine and Screening", "Geriatric Primary Care", "Women's Health in Primary Care", "Pediatric Primary Care", "Mental Health in Primary Care"] },
          { name: "Gastroenterology", topics: ["Inflammatory Bowel Disease", "Liver Disease and Hepatology", "Colorectal Disease", "Esophageal Disease", "Functional GI Disorders", "Endoscopy and Endoscopic Techniques", "Pancreatic Disease"] },
          { name: "Genetics (Medical)", topics: ["Clinical Genetics", "Genetic Counseling", "Molecular Genetics in Medicine", "Genomic Medicine", "Cancer Genetics", "Pharmacogenomics", "Rare Genetic Diseases"] },
          { name: "Geriatrics and Gerontology", topics: ["Biology of Aging", "Geriatric Assessment", "Dementia and Cognitive Decline", "Falls and Mobility Impairment", "Polypharmacy in Elderly", "Palliative Care", "Social Aspects of Aging"] },
          { name: "Hematology", topics: ["Anemia", "Coagulation Disorders and Thrombosis", "Leukemia", "Lymphoma", "Stem Cell Transplantation", "Transfusion Medicine", "Myeloproliferative Neoplasms"] },
          { name: "Histology", topics: ["Tissue Organization", "Epithelial Tissue", "Connective Tissue", "Muscle Tissue", "Nervous Tissue", "Pathological Histology", "Immunohistochemistry"] },
          { name: "Immunology and Allergy", topics: ["Allergy and Hypersensitivity", "Autoimmune Disease", "Clinical Immunology", "Primary Immunodeficiency", "Transplant Immunology", "Tumor Immunology", "Immunotherapy"] },
          { name: "Internal Medicine", topics: ["General Internal Medicine", "Evidence-Based Medicine", "Clinical Reasoning and Diagnosis", "Medical Ethics", "Systemic Disease Management", "Multimorbidity", "Preventive Medicine"] },
          { name: "Microbiology (Medical)", topics: ["Bacterial Infections", "Viral Infections", "Fungal Infections", "Antibiotic Resistance", "Hospital-Acquired Infections", "Infection Control", "Tropical Infectious Diseases"] },
          { name: "Nephrology", topics: ["Chronic Kidney Disease", "Glomerulonephritis", "Dialysis (Hemodialysis and Peritoneal)", "Kidney Transplantation", "Fluid and Electrolyte Disorders", "Hypertension and the Kidney"] },
          { name: "Neurology (Clinical)", topics: ["Stroke and Cerebrovascular Disease", "Epilepsy", "Neurodegenerative Disease", "Headache Disorders", "Neuromuscular Disease", "Multiple Sclerosis", "Movement Disorders"] },
          { name: "Nuclear Medicine and Imaging", topics: ["PET Imaging", "SPECT Imaging", "Radionuclide Therapy", "Molecular Imaging", "Nuclear Cardiology", "Oncological Nuclear Medicine", "Thyroid Scintigraphy"] },
          { name: "Obstetrics and Gynecology", topics: ["Prenatal Care", "Labor and Delivery", "Gynecological Oncology", "Reproductive Endocrinology and Infertility", "Maternal-Fetal Medicine", "Gynecological Surgery", "Postpartum Care"] },
          { name: "Oncology", topics: ["Cancer Biology", "Medical Oncology", "Radiation Oncology", "Surgical Oncology", "Tumor Immunology and Immunotherapy", "Targeted Therapy", "Clinical Trials in Oncology"] },
          { name: "Ophthalmology", topics: ["Cataract Surgery", "Glaucoma", "Retinal Disease", "Refractive Surgery", "Neuro-ophthalmology", "Ocular Oncology", "Corneal Disease and Transplantation"] },
          { name: "Orthopedics and Sports Medicine", topics: ["Fracture Management", "Joint Replacement", "Spinal Surgery", "Sports Injuries", "Pediatric Orthopedics", "Orthopedic Oncology", "Shoulder and Knee Surgery"] },
          { name: "Otorhinolaryngology", topics: ["Otology and Hearing Disorders", "Rhinology and Sinusology", "Laryngology and Voice Disorders", "Head and Neck Surgery", "Pediatric ENT", "Cochlear Implants", "Sleep Apnea Surgery"] },
          { name: "Pathology and Forensic Medicine", topics: ["Anatomical Pathology", "Clinical Pathology", "Forensic Pathology", "Molecular Pathology", "Cytopathology", "Autopsy and Death Investigation", "Surgical Pathology"] },
          { name: "Pediatrics, Perinatology and Child Health", topics: ["Neonatology", "Pediatric Subspecialties", "Child Development and Growth", "Pediatric Infectious Disease", "Pediatric Nutrition", "Adolescent Medicine", "Pediatric Chronic Disease"] },
          { name: "Physiology (Medical)", topics: ["Cardiovascular Physiology", "Renal Physiology", "Respiratory Physiology", "Neurophysiology", "Endocrine Physiology", "Gastrointestinal Physiology", "Exercise Physiology"] },
          { name: "Psychiatry and Mental Health", topics: ["Mood Disorders", "Psychotic Disorders", "Anxiety and Related Disorders", "Addiction Psychiatry", "Child and Adolescent Psychiatry", "Forensic Psychiatry", "Psychotherapy and Pharmacotherapy"] },
          { name: "Public Health, Environmental and Occupational Health", topics: ["Epidemiology (Public Health)", "Health Policy and Systems", "Global Health", "Environmental Health", "Occupational Medicine", "Health Promotion and Disease Prevention", "Social Determinants of Health"] },
          { name: "Pulmonary and Respiratory Medicine", topics: ["Asthma", "Chronic Obstructive Pulmonary Disease", "Respiratory Failure", "Lung Cancer", "Interstitial Lung Disease", "Sleep Medicine", "Pulmonary Hypertension"] },
          { name: "Radiology, Nuclear Medicine and Imaging", topics: ["Diagnostic Radiology", "Interventional Radiology", "MRI Imaging", "CT Scanning", "Ultrasound Diagnostics", "Mammography", "Pediatric Radiology"] },
          { name: "Rehabilitation", topics: ["Physical Medicine and Rehabilitation", "Neurological Rehabilitation", "Cardiac Rehabilitation", "Pulmonary Rehabilitation", "Occupational Rehabilitation", "Stroke Rehabilitation", "Musculoskeletal Rehabilitation"] },
          { name: "Reproductive Medicine", topics: ["Infertility and Assisted Reproduction", "Contraception", "Polycystic Ovary Syndrome", "Reproductive Genetics", "Andrology and Male Fertility", "Menopause Medicine", "Endometriosis"] },
          { name: "Rheumatology", topics: ["Rheumatoid Arthritis", "Osteoarthritis", "Systemic Lupus Erythematosus", "Gout and Crystal Arthropathies", "Vasculitis", "Spondyloarthropathies", "Fibromyalgia and Chronic Pain"] },
          { name: "Surgery", topics: ["General Surgery", "Minimally Invasive and Robotic Surgery", "Trauma Surgery", "Vascular Surgery", "Plastic and Reconstructive Surgery", "Surgical Oncology", "Pediatric Surgery"] },
          { name: "Transplantation", topics: ["Kidney Transplantation", "Liver Transplantation", "Heart and Lung Transplantation", "Transplant Immunology", "Rejection and Tolerance", "Living Donor Transplantation", "Pediatric Transplantation"] },
          { name: "Urology", topics: ["Urological Oncology", "Benign Prostatic Hyperplasia", "Urinary Incontinence", "Kidney Stones (Urolithiasis)", "Male Reproductive Urology", "Minimally Invasive Urology", "Pediatric Urology"] },
          { name: "Virology", topics: ["Viral Pathogenesis", "Antiviral Therapy", "HIV/AIDS", "Emerging Viral Diseases", "Respiratory Viruses", "Viral Immunology", "Oncogenic Viruses", "Viral Vaccines"] },
        ],
      },
      {
        name: "Nursing",
        subfields: [
          { name: "Advanced and Specialized Nursing", topics: ["Nurse Practitioner Practice", "Clinical Nurse Specialist Role", "Nurse Anesthesia", "Midwifery Practice", "Advanced Clinical Assessment", "Prescribing and Pharmacotherapy"] },
          { name: "Community Health Nursing", topics: ["Public Health Nursing", "School Health Nursing", "Home Health and Homecare", "Health Promotion and Education", "Case Management in Community", "Community Needs Assessment"] },
          { name: "Critical Care Nursing", topics: ["ICU Nursing Practice", "Emergency Nursing", "Post-Anesthesia Care Nursing", "Hemodynamic Monitoring", "Ventilator Management (Nursing)", "Critical Care Pharmacology (Nursing)"] },
          { name: "Issues, Ethics and Legal Aspects", topics: ["Nursing Ethics and Moral Distress", "Patient Rights and Advocacy", "Scope of Practice", "Nursing Malpractice and Liability", "Professional Regulation", "Informed Consent in Nursing"] },
          { name: "Leadership and Management", topics: ["Nursing Leadership and Management", "Healthcare Quality Improvement", "Staffing and Workforce Planning", "Evidence-Based Practice", "Nursing Education", "Clinical Governance"] },
          { name: "Maternity and Midwifery", topics: ["Antenatal Care", "Intrapartum Care and Labor Support", "Postnatal Care", "Neonatal Nursing", "High-Risk Pregnancy", "Midwifery Models of Care"] },
          { name: "Mental Health Nursing", topics: ["Psychiatric Assessment in Nursing", "Therapeutic Relationships", "Medication Management (Mental Health)", "De-escalation and Safety", "Recovery-Oriented Practice", "Psychosocial Interventions"] },
          { name: "Oncology Nursing", topics: ["Chemotherapy Administration and Safety", "Symptom Management in Cancer", "Palliative and End-of-Life Nursing", "Cancer Survivorship Care", "Radiation Therapy Nursing", "Oncology Clinical Trials Nursing"] },
          { name: "Pediatric Nursing", topics: ["Child Development and Assessment", "Pediatric Patient and Family Care", "Neonatal and NICU Nursing", "Pediatric Emergency Nursing", "Pediatric Chronic Disease Management", "Child Protection Nursing"] },
        ],
      },
      {
        name: "Veterinary",
        subfields: [
          { name: "Equine Medicine", topics: ["Equine Internal Medicine", "Equine Surgery", "Equine Lameness and Orthopedics", "Equine Reproduction", "Equine Emergency Medicine", "Equine Performance and Sports Medicine"] },
          { name: "Food Animal Medicine", topics: ["Bovine Medicine", "Porcine Medicine", "Ovine and Caprine Medicine", "Herd and Flock Health Management", "Food Safety and Animal Production", "Zoonotic Disease Control"] },
          { name: "Small Animal Medicine", topics: ["Canine Internal Medicine", "Feline Medicine", "Small Animal Surgery", "Small Animal Dermatology", "Exotic and Pocket Pet Medicine", "Small Animal Emergency Medicine"] },
          { name: "Veterinary (Miscellaneous)", topics: ["Veterinary Pathology", "Veterinary Pharmacology and Toxicology", "Veterinary Public Health", "Comparative and Laboratory Animal Medicine", "Wildlife Medicine and Conservation", "Aquatic and Zoo Animal Medicine"] },
        ],
      },
    ],
  },
  {
    name: "Life Sciences",
    fields: [
      {
        name: "Agricultural and Biological Sciences",
        subfields: [
          { name: "Agronomy and Crop Science", topics: ["Crop Physiology", "Crop Breeding and Genetics", "Soil-Plant Interactions", "Crop Production Systems", "Agrometeorology", "Integrated Crop Protection", "Precision Agronomy", "Dryland Farming"] },
          { name: "Animal Science and Zoology", topics: ["Animal Physiology", "Animal Nutrition", "Animal Genetics and Breeding", "Animal Behavior and Ethology", "Livestock Production Systems", "Wild Animal Biology", "Animal Welfare"] },
          { name: "Aquatic Science", topics: ["Freshwater Biology and Ecology", "Marine Biology", "Fisheries Science and Management", "Aquaculture", "Limnology", "Aquatic Toxicology", "Coral Reef Biology", "Wetland Ecology"] },
          { name: "Ecology, Evolution, Behavior and Systematics", topics: ["Population Ecology", "Community Ecology", "Evolutionary Biology", "Behavioral Ecology", "Systematics and Taxonomy", "Conservation Biology", "Phylogenetics", "Coevolution"] },
          { name: "Food Science", topics: ["Food Chemistry", "Food Microbiology and Safety", "Food Processing and Technology", "Nutritional Science", "Sensory Science", "Food Policy and Regulation", "Fermentation Technology", "Food Packaging"] },
          { name: "Forestry", topics: ["Silviculture", "Forest Ecology", "Forest Management and Planning", "Forest Hydrology", "Agroforestry", "Wood Science and Technology", "Urban Forestry", "Forest Carbon and Climate"] },
          { name: "Genetics", topics: ["Classical Genetics", "Population Genetics", "Quantitative Genetics", "Genomics", "Epigenetics", "Genetic Engineering", "Developmental Genetics", "Evolutionary Genetics"] },
          { name: "Horticulture", topics: ["Fruit Science and Production", "Vegetable Science", "Ornamental Horticulture", "Viticulture and Enology", "Post-Harvest Technology", "Urban and Indoor Horticulture", "Greenhouse Production"] },
          { name: "Insect Science", topics: ["Insect Physiology", "Entomology and Pest Management", "Insect Ecology", "Insect Taxonomy and Systematics", "Apiculture and Bee Biology", "Insect Pathology", "Biological Control", "Medical Entomology"] },
          { name: "Plant Science", topics: ["Plant Physiology", "Plant Molecular Biology", "Plant Ecology", "Plant Pathology", "Plant Breeding", "Plant Biochemistry", "Plant Developmental Biology", "Photosynthesis"] },
          { name: "Soil Science", topics: ["Soil Physics", "Soil Chemistry and Nutrient Cycling", "Soil Biology and Microbiology", "Soil Fertility and Plant Nutrition", "Soil Formation and Classification", "Soil Degradation and Conservation", "Soil Carbon and Climate"] },
          { name: "Structural Biology", topics: ["Protein Structure and Folding", "Nucleic Acid Structure", "X-ray Crystallography", "Cryo-Electron Microscopy", "NMR in Structural Biology", "Macromolecular Assemblies", "Structural Bioinformatics", "Drug-Target Structures"] },
        ],
      },
      {
        name: "Biochemistry, Genetics and Molecular Biology",
        subfields: [
          { name: "Biochemistry", topics: ["Enzyme Biochemistry", "Metabolic Pathways", "Protein Biochemistry", "Lipid Biochemistry", "Carbohydrate Biochemistry", "Energy Metabolism", "Nucleotide and Cofactor Biochemistry"] },
          { name: "Biophysics", topics: ["Molecular Biophysics", "Membrane Biophysics", "Single-Molecule Biophysics", "Computational Biophysics", "NMR in Biology", "Fluorescence Microscopy", "Force Spectroscopy", "Ion Channels and Electrophysiology"] },
          { name: "Cancer Research", topics: ["Oncogenes and Tumor Suppressors", "Cancer Cell Biology", "Tumor Microenvironment", "Cancer Genetics and Genomics", "Targeted Cancer Therapeutics", "Metastasis and Invasion", "Cancer Immunotherapy", "Cancer Epidemiology (Biological)"] },
          { name: "Cell Biology", topics: ["Cell Signaling Pathways", "Cell Division and Mitosis", "Organelle Biology", "Cell Adhesion and Migration", "Autophagy", "Programmed Cell Death", "Membrane Trafficking", "Cell Polarity"] },
          { name: "Clinical Biochemistry", topics: ["Diagnostic Biochemistry", "Metabolic Disease (Biochemical)", "Enzyme Diagnostics", "Tumor Markers", "Point-of-Care Testing", "Biomarker Discovery", "Clinical Laboratory Methods"] },
          { name: "Developmental Biology", topics: ["Embryogenesis and Gastrulation", "Pattern Formation", "Cell Differentiation", "Stem Cell Biology", "Organogenesis", "Developmental Genetics", "Regeneration Biology"] },
          { name: "Endocrinology", topics: ["Hormone Biosynthesis and Signaling", "Hypothalamic-Pituitary Axis", "Thyroid Biology", "Adrenal Biology and Steroids", "Pancreatic Hormones and Insulin Signaling", "Reproductive Endocrinology", "Circadian Biology"] },
          { name: "Genetics", topics: ["Gene Structure and Regulation", "Genome Organization and Evolution", "DNA Mutation and Repair", "Genetic Variation and SNPs", "Model Organisms in Genetics", "Functional Genomics", "Epigenetics"] },
          { name: "Molecular Biology", topics: ["DNA Replication", "Transcription and RNA Processing", "Translation and Protein Synthesis", "RNA Biology and Non-Coding RNA", "Gene Regulation", "CRISPR and Genome Editing", "Molecular Cloning"] },
          { name: "Molecular Medicine", topics: ["Molecular Diagnostics", "Gene Therapy", "Molecular Targets in Disease", "Pharmacogenomics", "Personalized Medicine", "Protein Therapeutics", "Oligonucleotide Therapeutics"] },
          { name: "Physiology", topics: ["Cell Physiology", "Cardiovascular Physiology", "Renal and Fluid Physiology", "Respiratory Physiology", "Neurophysiology", "Integrative and Systems Physiology", "Exercise Physiology"] },
          { name: "Structural Biology", topics: ["Protein Folding and Misfolding", "X-ray Crystallography", "Cryo-Electron Microscopy (Structural)", "NMR Spectroscopy (Structural)", "Structural Bioinformatics", "Macromolecular Complexes", "Intrinsically Disordered Proteins"] },
        ],
      },
      {
        name: "Immunology and Microbiology",
        subfields: [
          { name: "Applied Microbiology and Biotechnology", topics: ["Fermentation Technology", "Biotransformation and Biocatalysis", "Bioremediation", "Industrial Biotechnology", "Microbial Genomics and Metagenomics", "Synthetic Biology (Microbial)", "Biopolymer Production"] },
          { name: "Immunology", topics: ["Innate Immunity", "Adaptive Immunity", "Immunological Memory", "Autoimmunity", "Tumor Immunology", "Vaccine Immunology", "Mucosal Immunity", "Immunodeficiency"] },
          { name: "Microbiology", topics: ["Bacterial Physiology and Genetics", "Viral Biology and Replication", "Fungal Biology", "Protozoan Biology", "Microbial Ecology", "Antimicrobial Resistance", "Biofilms", "Host-Microbiome Interactions"] },
          { name: "Parasitology", topics: ["Protozoal Parasites", "Helminth Parasites", "Vector Biology", "Malaria and Tropical Diseases", "Host-Parasite Interactions", "Antiparasitic Drug Discovery", "Parasite Immunology"] },
          { name: "Virology", topics: ["Virus Structure and Replication Mechanisms", "Viral Pathogenesis", "Antiviral Immunity", "Emerging and Re-emerging Viruses", "Viral Evolution and Phylodynamics", "Oncogenic Viruses", "Respiratory Viruses"] },
        ],
      },
      {
        name: "Neuroscience",
        subfields: [
          { name: "Behavioral Neuroscience", topics: ["Learning and Memory (Behavioral)", "Motivation and Reward Circuits", "Fear and Stress Neuroscience", "Social Behavior and Neuroscience", "Sleep and Circadian Neurobiology", "Addiction Neuroscience", "Feeding Behavior"] },
          { name: "Biological Psychiatry", topics: ["Neurobiology of Depression", "Schizophrenia Neuroscience", "Anxiety Disorders Neuroscience", "Addiction Biology", "Neuroimaging in Psychiatry", "Psychopharmacology", "Neurodevelopmental Disorders"] },
          { name: "Cellular and Molecular Neuroscience", topics: ["Neuronal Signaling and Electrophysiology", "Synaptic Physiology and Plasticity", "Glial Biology", "Neurotrophic Factors and Survival", "Neuronal Development", "Neurodegeneration (Molecular)"] },
          { name: "Cognitive Neuroscience", topics: ["Attention and Perception Neuroscience", "Learning and Memory (Cognitive Neuro)", "Language Neuroscience", "Decision Neuroscience", "Social Neuroscience", "Executive Function and Prefrontal Cortex"] },
          { name: "Developmental Neuroscience", topics: ["Neural Induction and Patterning", "Axon Guidance", "Synapse Formation and Elimination", "Critical Periods and Plasticity", "Neuroplasticity", "Neurodevelopmental Disorders Biology"] },
          { name: "Endocrine and Autonomic Systems", topics: ["Neuroendocrinology", "Autonomic Nervous System Regulation", "Stress and the HPA Axis", "Reproductive Neuroendocrinology", "Circadian Clocks in Brain", "Gut-Brain Axis"] },
          { name: "Neuropsychology and Physiological Psychology", topics: ["Neuropsychological Assessment", "Traumatic Brain Injury", "Cognitive Impairment and Dementia", "Rehabilitation Neuroscience", "Psychophysiology", "Neuropsychology of Emotion"] },
          { name: "Sensory Systems", topics: ["Visual Neuroscience", "Auditory Neuroscience and Hearing", "Somatosensory Systems and Touch", "Olfaction and Gustation", "Vestibular System", "Pain Neuroscience", "Multisensory Integration"] },
        ],
      },
      {
        name: "Pharmacology, Toxicology and Pharmaceutics",
        subfields: [
          { name: "Drug Discovery", topics: ["Target Identification and Validation", "High-Throughput Screening", "Lead Optimization", "Rational Drug Design", "Pharmacological Screening", "In Silico Drug Discovery", "Clinical Translation and Development"] },
          { name: "Pharmaceutical Science", topics: ["Drug Formulation and Dosage Forms", "Drug Delivery Systems", "Biopharmaceutics and Bioavailability", "Pharmaceutical Biotechnology", "Pharmaceutical Analysis", "Regulatory Science and Drug Approval"] },
          { name: "Pharmacology", topics: ["Receptor Pharmacology", "Molecular Pharmacology", "Neuropharmacology", "Cardiovascular Pharmacology", "Endocrine Pharmacology", "Immunopharmacology", "Chemotherapy Pharmacology"] },
          { name: "Toxicology", topics: ["Mechanisms of Toxic Injury", "Environmental Toxicology", "Occupational Toxicology", "Clinical and Forensic Toxicology", "Carcinogenesis", "Reproductive and Developmental Toxicology", "Regulatory Toxicology"] },
        ],
      },
    ],
  },
];

export function getSubfields(domain: string, field: string): string[] {
  const d = OPENALEX_TAXONOMY.find((d) => d.name === domain);
  if (!d) return [];
  const f = d.fields.find((f) => f.name === field);
  return f?.subfields.map((sf) => sf.name) ?? [];
}

export function getTopics(domain: string, field: string, subfield: string): string[] {
  const d = OPENALEX_TAXONOMY.find((d) => d.name === domain);
  if (!d) return [];
  const f = d.fields.find((f) => f.name === field);
  if (!f) return [];
  const sf = f.subfields.find((sf) => sf.name === subfield);
  return sf?.topics ?? [];
}
