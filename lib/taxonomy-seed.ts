export interface SeedEntry {
  domain: string;
  l1: string[];
}

export const TAXONOMY_SEED: SeedEntry[] = [
  {
    domain: "Formal Sciences",
    l1: ["Mathematics", "Logic", "Statistics", "Computer Science", "Systems Theory", "Information Theory", "Decision Theory", "Game Theory"],
  },
  {
    domain: "Natural Sciences",
    l1: ["Physics", "Chemistry", "Biology", "Earth Sciences", "Astronomy & Astrophysics", "Ecology", "Oceanography", "Meteorology & Atmospheric Science"],
  },
  {
    domain: "Social Sciences",
    l1: ["Economics", "Psychology", "Sociology", "Anthropology", "Political Science", "Human Geography", "Demography", "Criminology", "Communication Studies"],
  },
  {
    domain: "Humanities",
    l1: ["Philosophy", "History", "Linguistics", "Literature", "Religious Studies", "Archaeology", "Cultural Studies", "Ethics", "Aesthetics"],
  },
  {
    domain: "Engineering & Applied Sciences",
    l1: ["Civil Engineering", "Mechanical Engineering", "Electrical Engineering", "Chemical Engineering", "Biomedical Engineering", "Aerospace Engineering", "Materials Science", "Environmental Engineering", "Industrial Engineering", "Nuclear Engineering"],
  },
  {
    domain: "Health & Medicine",
    l1: ["Anatomy", "Physiology", "Biochemistry & Molecular Biology", "Pharmacology", "Clinical Medicine", "Surgery", "Psychiatry & Mental Health", "Nursing", "Public Health & Epidemiology", "Dentistry", "Veterinary Medicine"],
  },
  {
    domain: "Technology & Computing",
    l1: ["Artificial Intelligence & Machine Learning", "Software Engineering", "Computer Networks", "Databases & Information Systems", "Cybersecurity", "Human-Computer Interaction", "Computer Architecture", "Distributed Systems", "Robotics"],
  },
  {
    domain: "Business & Management",
    l1: ["Finance & Accounting", "Marketing", "Operations Management", "Strategic Management", "Human Resource Management", "Entrepreneurship", "International Business", "Supply Chain Management", "Organizational Behavior"],
  },
  {
    domain: "Law & Legal Studies",
    l1: ["Constitutional & Administrative Law", "Criminal Law", "International Law", "Corporate & Commercial Law", "Intellectual Property Law", "Environmental Law", "Human Rights Law", "Family Law", "Procedural Law"],
  },
  {
    domain: "Arts & Design",
    l1: ["Visual Arts & Painting", "Sculpture", "Music", "Theater & Performance", "Film & Cinema Studies", "Architecture", "Graphic & Industrial Design", "Photography", "Dance", "Literature & Creative Writing"],
  },
  {
    domain: "Education & Pedagogy",
    l1: ["Curriculum Theory", "Educational Psychology", "Special Education", "Higher Education", "E-Learning & Educational Technology", "Early Childhood Education", "Educational Policy", "Assessment & Evaluation"],
  },
  {
    domain: "Environmental & Agricultural Sciences",
    l1: ["Environmental Science", "Conservation Biology", "Climate Science", "Agriculture & Agronomy", "Forestry", "Marine & Aquatic Sciences", "Sustainable Development", "Soil Science", "Food Science & Technology"],
  },
  {
    domain: "Interdisciplinary & Emerging Fields",
    l1: ["Cognitive Science", "Neuroscience", "Bioinformatics & Computational Biology", "Science & Technology Studies", "Gender & Feminist Studies", "Urban Studies", "Development Studies", "Peace & Conflict Studies", "Data Science", "Nanotechnology"],
  },
];
