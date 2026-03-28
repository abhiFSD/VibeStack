import { API } from 'aws-amplify';
import * as queries from '../graphql/queries';
import * as mutations from '../graphql/mutations';

/**
 * Clones a learning and all its associated content for an organization
 * @param {string} learningId - ID of the learning to clone
 * @param {string} organizationId - ID of the organization to clone for
 * @returns {Promise<Object>} - The newly created learning
 */
export const cloneLearningForOrganization = async (learningId, organizationId) => {
  try {
    // 1. Fetch the original learning with all its content
    const learningResponse = await API.graphql({
      query: queries.getLearning,
      variables: { id: learningId }
    });
    const originalLearning = learningResponse.data.getLearning;

    // 2. Create new learning for the organization
    const newLearningInput = {
      title: originalLearning.title,
      description: originalLearning.description,
      orderIndex: originalLearning.orderIndex,
      isDefault: false,
      readTime: originalLearning.readTime,
      organizationID: organizationId,
      clonedFromID: learningId
    };

    const newLearningResponse = await API.graphql({
      query: mutations.createLearning,
      variables: { input: newLearningInput }
    });
    const newLearning = newLearningResponse.data.createLearning;

    // 3. Clone chapters
    const chaptersResponse = await API.graphql({
      query: queries.chaptersByLearningIdAndPosition,
      variables: { 
        learningId,
        sortDirection: 'ASC',
        filter: { _deleted: { ne: true } }
      }
    });
    
    const chapters = chaptersResponse.data.chaptersByLearningIdAndPosition.items;
    
    // Map to store old ID to new ID mappings
    const chapterIdMap = new Map();
    const sectionIdMap = new Map();

    // Clone each chapter and its content
    for (const chapter of chapters) {
      // Clone the post first if it exists
      let newPostId = null;
      if (chapter.postId) {
        const postResponse = await API.graphql({
          query: queries.getPost,
          variables: { id: chapter.postId }
        });
        const originalPost = postResponse.data.getPost;
        
        const newPostResponse = await API.graphql({
          query: mutations.createPost,
          variables: {
            input: {
              content: originalPost.content,
              organizationId: organizationId,
              isDefault: false
            }
          }
        });
        newPostId = newPostResponse.data.createPost.id;
      }

      // Create new chapter
      const newChapterResponse = await API.graphql({
        query: mutations.createChapter,
        variables: {
          input: {
            title: chapter.title,
            slug: chapter.slug,
            position: chapter.position,
            postId: newPostId,
            learningId: newLearning.id,
            organizationId: organizationId,
            isDefault: false
          }
        }
      });
      const newChapter = newChapterResponse.data.createChapter;
      chapterIdMap.set(chapter.id, newChapter.id);

      // Fetch sections for this chapter
      const sectionsResponse = await API.graphql({
        query: queries.sectionsByChapterIdAndPosition,
        variables: { 
          chapterId: chapter.id,
          sortDirection: 'ASC',
          filter: { _deleted: { ne: true } }
        }
      });
      
      const sections = sectionsResponse.data.sectionsByChapterIdAndPosition.items;
      
      // Clone each section
      for (const section of sections) {
        let newSectionPostId = null;
        if (section.postId) {
          const postResponse = await API.graphql({
            query: queries.getPost,
            variables: { id: section.postId }
          });
          const originalPost = postResponse.data.getPost;
          
          const newPostResponse = await API.graphql({
            query: mutations.createPost,
            variables: {
              input: {
                content: originalPost.content,
                organizationId: organizationId,
                isDefault: false
              }
            }
          });
          newSectionPostId = newPostResponse.data.createPost.id;
        }

        // Create new section
        const newSectionResponse = await API.graphql({
          query: mutations.createSection,
          variables: {
            input: {
              title: section.title,
              slug: section.slug,
              position: section.position,
              chapterId: newChapter.id,
              postId: newSectionPostId,
              organizationId: organizationId,
              isDefault: false
            }
          }
        });
        const newSection = newSectionResponse.data.createSection;
        sectionIdMap.set(section.id, newSection.id);

        // Fetch subsections for this section
        const subSectionsResponse = await API.graphql({
          query: queries.subSectionsBySectionIdAndPosition,
          variables: { 
            sectionId: section.id,
            sortDirection: 'ASC',
            filter: { _deleted: { ne: true } }
          }
        });
        
        const subSections = subSectionsResponse.data.subSectionsBySectionIdAndPosition.items;
        
        // Clone each subsection
        for (const subSection of subSections) {
          let newSubSectionPostId = null;
          if (subSection.postId) {
            const postResponse = await API.graphql({
              query: queries.getPost,
              variables: { id: subSection.postId }
            });
            const originalPost = postResponse.data.getPost;
            
            const newPostResponse = await API.graphql({
              query: mutations.createPost,
              variables: {
                input: {
                  content: originalPost.content,
                  organizationId: organizationId,
                  isDefault: false
                }
              }
            });
            newSubSectionPostId = newPostResponse.data.createPost.id;
          }

          // Create new subsection
          await API.graphql({
            query: mutations.createSubSection,
            variables: {
              input: {
                title: subSection.title,
                slug: subSection.slug,
                position: subSection.position,
                sectionId: newSection.id,
                postId: newSubSectionPostId,
                organizationId: organizationId
              }
            }
          });
        }
      }
    }

    // 4. Clone quizzes and questions
    const quizzesResponse = await API.graphql({
      query: queries.quizzesByLearningId,
      variables: { 
        learningId,
        filter: {
          _deleted: { ne: true }
        }
      }
    });

    const quizzes = quizzesResponse.data.quizzesByLearningId.items;
    
    for (const quiz of quizzes) {
      // Create new quiz
      const newQuizResponse = await API.graphql({
        query: mutations.createQuiz,
        variables: {
          input: {
            title: quiz.title,
            description: quiz.description,
            learningId: newLearning.id
          }
        }
      });
      const newQuiz = newQuizResponse.data.createQuiz;

      // Clone questions
      const questionsResponse = await API.graphql({
        query: queries.questionsByQuizId,
        variables: { 
          quizId: quiz.id,
          filter: {
            _deleted: { ne: true }
          }
        }
      });

      const questions = questionsResponse.data.questionsByQuizId.items;
      
      for (const question of questions) {
        await API.graphql({
          query: mutations.createQuestion,
          variables: {
            input: {
              content: question.content,
              options: question.options,
              correctOption: question.correctOption,
              explanation: question.explanation,
              orderIndex: question.orderIndex,
              quizId: newQuiz.id
            }
          }
        });
      }
    }

    return newLearning;
  } catch (error) {
    console.error('Error cloning learning:', error);
    throw error;
  }
}; 