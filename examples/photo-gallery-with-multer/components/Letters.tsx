const IS_BLANK = /^\s*$/;

export interface LetterProps {
  text: string;
  ignoreBlank?: boolean;
  letterClassName?: string;
}

export const Letters: React.FC<LetterProps> = ({ text, letterClassName, ignoreBlank = true }) => {
  const chars = text.trim().split('');

  return (
    <>
      {chars.map((char, index) => (
        <span key={index} className={ignoreBlank && IS_BLANK.test(char) ? '' : letterClassName}>
          {char}
        </span>
      ))}
    </>
  );
};
