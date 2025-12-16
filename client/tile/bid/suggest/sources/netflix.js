export const enrichNetflix = async (prev) => {
  const [title] = prev.title.split(' | ')

  return {
    title: title.replace(/^Watch/, '').trim(),
    description: prev.description,
    image: prev.image,
  }
}
