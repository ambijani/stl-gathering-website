// Shared by the gatherings list and the gathering detail page. Varo titles are matched by exact name
// in Varo history, so change a title here only together with scripts/rename-varo-title.ts.

export const FRIDAY_VAROS = ["1st Dua", "1st Dua Tasbih (Farsi)", "Standing Tasbih", "Ginan/Qasida", "Farman", "2nd Dua", "2nd Dua Tasbih", "Announcements", "Conclusion Dua"];
export const CHANDRAAT_VAROS = ["1st Dua", "1st Dua Tasbih (Farsi)", "Standing Tasbih", "Ginan/Qasida", "Farman", "2nd Dua", "2nd Dua Tasbih", "Chandraat Ginan", "Article of the Month", "Chandraat Tasbih", "Announcements", "Conclusion Dua"];
export const KUSHALI_VAROS = ["1st Dua", "1st Dua Tasbih (Farsi)", "Kushali Standing Tasbih", "Ginan/Qasida", "Taliqah Ginan", "Farman", "2nd Dua", "2nd Dua Tasbih", "Announcements", "Conclusion Dua"];
export const EID_VAROS = ["Eid Namaz Reciter", "Eid Namaz Announcement/Gist"];
export const TALIQAH_VAROS = ["1st Dua", "1st Dua Tasbih (Farsi)", "Standing Tasbih", "Ginan/Qasida", "Taliqah Ginan", "Farman", "2nd Dua", "2nd Dua Tasbih", "Announcements", "Conclusion Dua"];

/** Gathering types, with the badge colours used on the gatherings list. The last entry is the fallback. */
export const GATHERING_TYPES: { value: string; bg: string; text: string }[] = [
  { value: "Friday Vaaros",    bg: "bg-green-100",  text: "text-green-700"  },
  { value: "Chandraat Vaaros", bg: "bg-purple-100", text: "text-purple-700" },
  { value: "Kushali",          bg: "bg-yellow-100", text: "text-yellow-700" },
  { value: "Eid",              bg: "bg-blue-100",   text: "text-blue-700"   },
  { value: "Taliqah",          bg: "bg-orange-100", text: "text-orange-700" },
  { value: "Other",            bg: "bg-gray-100",   text: "text-gray-600"   },
];
