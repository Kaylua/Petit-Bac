import slugify from "slugify";

export function is_answer_valid(letter, answer) {
  try {
    return slugify(answer, {lower: true})[0] === slugify(letter, {lower: true})[0];
  }
  catch (e) {
    throw new Error("is_answer_valid: string arguments expected");
  }
}

export function is_answer_accepted(votes) {
  let bools_votes = Object.values(votes);
  return (bools_votes.filter(vote => vote).length / bools_votes.length) > .5;
}

function normalize_answer(answer) {
  return answer ? answer.toLowerCase().trim().replace(/\s+/, ' ') : null;
}

export function compare_answers(answer1, answer2) {
  return normalize_answer(answer1) === normalize_answer(answer2);
}
