export type ProfileExampleId = 'beginner' | 'growth' | 'established' | 'large' | 'mega';

export interface ProfileAnalyzerExample {
  id: ProfileExampleId;
  followers: number;
  avgLikes: number;
  avgComments: number;
  postsPerWeek: number;
  niche?: string;
  personaTitleKey: string;
  personaDescKey: string;
}

export const PROFILE_ANALYZER_EXAMPLES: ProfileAnalyzerExample[] = [
  {
    id: 'beginner',
    followers: 2000,
    avgLikes: 70,
    avgComments: 5,
    postsPerWeek: 2,
    personaTitleKey: 'profile.examples.personas.beginner.title',
    personaDescKey: 'profile.examples.personas.beginner.desc',
  },
  {
    id: 'growth',
    followers: 15000,
    avgLikes: 450,
    avgComments: 25,
    postsPerWeek: 3,
    personaTitleKey: 'profile.examples.personas.growth.title',
    personaDescKey: 'profile.examples.personas.growth.desc',
  },
  {
    id: 'established',
    followers: 120000,
    avgLikes: 1600,
    avgComments: 80,
    postsPerWeek: 4,
    personaTitleKey: 'profile.examples.personas.established.title',
    personaDescKey: 'profile.examples.personas.established.desc',
  },
  {
    id: 'large',
    followers: 700000,
    avgLikes: 8000,
    avgComments: 300,
    postsPerWeek: 4,
    personaTitleKey: 'profile.examples.personas.large.title',
    personaDescKey: 'profile.examples.personas.large.desc',
  },
  {
    id: 'mega',
    followers: 2000000,
    avgLikes: 18000,
    avgComments: 600,
    postsPerWeek: 5,
    personaTitleKey: 'profile.examples.personas.mega.title',
    personaDescKey: 'profile.examples.personas.mega.desc',
  },
];


