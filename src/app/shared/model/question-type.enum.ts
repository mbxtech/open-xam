export enum QuestionType {
  SINGLE_CHOICE = 'SINGLE_CHOICE',
  ASSIGNMENT = 'ASSIGNMENT',
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  CODE = 'CODE'
}

export const questionTypesSelectOptions = () => {
  const options: { value: any, label: string }[] = []
  options.push({value: QuestionType.SINGLE_CHOICE, label: $localize`:@@ox.questionType.DEFAULT:Single choice`});
  options.push({value: QuestionType.ASSIGNMENT, label: $localize`:@@ox.questionType.ASSIGNMENT:Assigment`});
  options.push({value: QuestionType.MULTIPLE_CHOICE, label: $localize`:@@ox.questionType.MULTIPLE_CHOICE:Multiple choice`});
  options.push({value: QuestionType.CODE, label: $localize`:@@ox.questionType.CODE:Source Code`});
  return options;
}


export const mapQuestionTypeToText = (q: QuestionType) => {
  switch(q) {
    case QuestionType.SINGLE_CHOICE:
      return $localize`:@@ox.questionType.DEFAULT:Single choice`;
    case QuestionType.ASSIGNMENT:
      return $localize`:@@ox.questionType.ASSIGNMENT:Assigment`;
    case QuestionType.MULTIPLE_CHOICE:
      return $localize`:@@ox.questionType.MULTIPLE_CHOICE:Multiple choice`;
    case QuestionType.CODE:
      return $localize`:@@ox.questionType.CODE:Source Code`;
  }
} 