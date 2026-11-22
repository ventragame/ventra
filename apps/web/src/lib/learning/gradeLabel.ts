/** Header chip text for a child's grade. Profiles may have no grade yet:
 * show "Sınıf seçilmedi" (as the journey card does), never "—. sınıf". */
export function gradeLevelLabel(gradeLevel?:number|null):string{
 return gradeLevel!=null&&Number.isInteger(gradeLevel)&&gradeLevel>0?`${gradeLevel}. sınıf`:'Sınıf seçilmedi';
}
