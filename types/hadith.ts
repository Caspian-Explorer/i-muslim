export type HadithGrade = {
  name: string;
  grade: string;
};

export type HadithRef = {
  book: number;
  hadith: number;
};

export type HadithEntry = {
  hadithnumber: number;
  arabicnumber: number;
  text: string;
  grades: HadithGrade[];
  reference: HadithRef;
};

export type SectionDetails = {
  hadithnumber_first: number;
  hadithnumber_last: number;
  arabicnumber_first: number;
  arabicnumber_last: number;
};

export type EditionMetadata = {
  name: string;
  sections: Record<string, string>;
  section_details: Record<string, SectionDetails>;
};

export type HadithEdition = {
  metadata: EditionMetadata;
  hadiths: HadithEntry[];
};

export type HadithCollection = {
  slug: string;
  name: string;
  arabicName: string;
  shortName?: string;
};

export type BookEntry = {
  number: number;
  name: string;
  count: number;
};
