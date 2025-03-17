import CountDownButtonModal from '@/components/CountDownButtonModal';
import { extractTime } from '@/helpers/strings';
import { useTranslation } from 'react-i18next';
import reactStringReplace from 'react-string-replace';
import { ReactNode } from 'react';

interface ActionTextProps {
  text: string;
}

export default function ActionText({ text }: ActionTextProps): ReactNode {
  const { t } = useTranslation();
  const seconds = extractTime(text, t('seconds'));

  let fixedText = text;

  seconds?.forEach((secondString) => {
    if (secondString) {
      fixedText = reactStringReplace(fixedText, secondString, (match, i) => (
        <CountDownButtonModal
          key={match + i}
          textString={secondString}
          preventParentClose={() => null}
          noPadding
        />
      ));
    }
  });

  return reactStringReplace(fixedText, '\n', (_, i) => <br key={`br${i}`} />);
}
