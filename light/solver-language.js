const messages={
'Розрахунок триває…':'Calculation in progress…',
'Розраховую повторні розсіювання…':'Calculating multiple scattering…',
'Обчислюю розсіювання на шляху до ока…':'Calculating scattering along the viewing path…',
'Не вдалося завершити розрахунок: ':'Calculation could not finish: ',
'Помилка розрахунку: ':'Calculation error: ',
'Нечислове значення у сітці переносу':'Non-finite value in the transfer grid',
'Нечислове значення у спектрі':'Non-finite value in the spectrum'};
export function englishStatus(value){let result=String(value);for(const [a,b]of Object.entries(messages))result=result.replace(a,b);return result;}
