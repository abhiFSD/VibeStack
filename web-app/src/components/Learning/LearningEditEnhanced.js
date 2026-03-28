import React, { useState, useEffect, useRef } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { API, Storage, Auth } from 'aws-amplify';
import { Container, Row, Col, ListGroup, Alert, Button, Modal, Form } from 'react-bootstrap';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import * as queries from '../../graphql/queries';
import * as mutations from '../../graphql/mutations';
import { useOrganization } from '../../contexts/OrganizationContext';
import { compressImage } from '../../utils/imageUtils';

// Helper function to refresh expired S3 URLs in content
const refreshImageUrls = async (content) => {
  if (!content || typeof content !== 'string') return content;
  
  // Regex to find S3 image URLs in the content
  const s3UrlRegex = /https:\/\/[^"'\s>]+\.s3\.[^"'\s>]+amazonaws\.com\/[^"'\s>]*learning-images[^"'\s>]*/g;
  const urls = content.match(s3UrlRegex);
  
  if (!urls || urls.length === 0) return content;
  
  let updatedContent = content;
  
  for (const url of urls) {
    try {
      // Extract the S3 key from the URL
      const urlObj = new URL(url);
      const key = urlObj.pathname.substring(1); // Remove leading '/'
      
      // Only process learning-images
      if (key.includes('learning-images/')) {
        // Check if URL is expired by trying to access it
        const isExpired = await checkUrlExpired(url);
        
        if (isExpired) {
          console.log('Refreshing expired image URL:', key);
          // Generate new signed URL
          const newUrl = await Storage.get(key, {
            level: 'public',
            expires: 3600 // 1 hour expiration
          });
          
          // Replace the old URL with the new one
          updatedContent = updatedContent.replace(url, newUrl);
          console.log('URL refreshed successfully');
        }
      }
    } catch (error) {
      console.error('Error refreshing image URL:', url, error);
    }
  }
  
  return updatedContent;
};

// Helper function to check if URL is expired
const checkUrlExpired = async (url) => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return !response.ok;
  } catch (error) {
    return true; // Assume expired if we can't access it
  }
};

// Custom Image Upload Handler for Quill
const ImageUpload = () => {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <rect className="ql-stroke" height="10" width="12" x="3" y="4"/>
      <circle className="ql-fill" cx="6" cy="7" r="1"/>
      <polyline className="ql-stroke" points="5,12 5,11 7,9 8,10 11,7 13,9 13,12 5,12"/>
    </svg>
  );
};

// Register the custom image icon
const icons = Quill.import('ui/icons');
icons['image'] = ImageUpload();

const LearningEditEnhanced = () => {
  const { learningId } = useParams();
  const [learning, setLearning] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { activeOrganization } = useOrganization();
  const [currentUser, setCurrentUser] = useState(null);
  const [hasAccess, setHasAccess] = useState(false);
  
  // Image upload states
  const [imageUploading, setImageUploading] = useState(false);
  const quillRef = useRef(null);
  
  // New state variables
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'add' or 'edit'
  const [itemType, setItemType] = useState(''); // 'chapter', 'section', or 'subsection'
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    position: 0
  });

  // Add new state for edit mode
  const [isEditing, setIsEditing] = useState(false);

  // Add new state for collapsed items
  const [collapsedItems, setCollapsedItems] = useState(new Set());

  // Add this near the top with other state declarations
  const [isProcessing, setIsProcessing] = useState(false);

  // Add these state variables after the other useState declarations
  const [showRearrangeModal, setShowRearrangeModal] = useState(false);
  const [rearrangeItems, setRearrangeItems] = useState([]);

  // Custom image upload handler
  const imageHandler = () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;

      try {
        setImageUploading(true);
        
        // Compress the image before uploading
        const compressedFile = await compressImage(file, {
          quality: 0.7, // Better quality for learning content
          maxWidth: 1200,
          maxHeight: 1200
        });

        // Upload to S3
        const key = `learning-images/${Date.now()}-${file.name}`;
        await Storage.put(key, compressedFile, {
          contentType: compressedFile.type,
        });

        // Get the URL with longer expiration
        const imageUrl = await Storage.get(key, {
          level: 'public',
          expires: 3600 // 1 hour expiration instead of default 15 minutes
        });
        
        // Insert image into editor
        const quill = quillRef.current.getEditor();
        const range = quill.getSelection();
        const index = range ? range.index : quill.getLength();
        
        quill.insertEmbed(index, 'image', imageUrl);
        quill.setSelection(index + 1);

        console.log('Image uploaded successfully:', { key, imageUrl });
      } catch (error) {
        console.error('Error uploading image:', error);
        setError('Failed to upload image. Please try again.');
      } finally {
        setImageUploading(false);
      }
    };
  };

  // Enhanced Quill editor modules with custom image handler
  const quillModules = {
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline'],
        ['blockquote'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        ['link', 'image'], // Image button included
        [{ 'align': [] }],
        ['clean']
      ],
      handlers: {
        image: imageHandler // Custom image handler
      }
    }
  };

  const quillFormats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'list', 'bullet',
    'align',
    'blockquote', 'code-block',
    'link', 'image'
  ];

  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const user = await Auth.currentAuthenticatedUser();
        setCurrentUser(user);
      } catch (error) {
        console.error('Error getting current user:', error);
      }
    };
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser && activeOrganization) {
      const isOwner = activeOrganization.owner === currentUser.attributes.sub;
      const isCoAdmin = Array.isArray(activeOrganization.additionalOwners) && 
                       activeOrganization.additionalOwners.includes(currentUser.attributes.email);
      setHasAccess(isOwner || isCoAdmin);
    }
  }, [currentUser, activeOrganization]);

  useEffect(() => {
    if (learningId) {
      fetchLearningContent(learningId);
    }
  }, [learningId]);

  useEffect(() => {
    if (learning) {
      console.log('Learning data structure:', {
        learning,
        firstChapter: learning.chapters?.[0],
        firstSection: learning.chapters?.[0]?.sections
      });
    }
  }, [learning]);

  useEffect(() => {
    if (selectedItem) {
      setFormData({
        title: selectedItem.title || '',
        content: selectedItem.post?.content || '',
        position: selectedItem.position || 0
      });
      setIsEditing(false);
    }
  }, [selectedItem?.id]);

  // Redirect if no access
  if (!loading && !hasAccess) {
    return <Navigate to="/" replace />;
  }

  const fetchLearningContent = async (id) => {
    try {
      // 1. Get the learning details
      console.log('Fetching learning with ID:', id);
      const learningResponse = await API.graphql({
        query: queries.getLearning,
        variables: { id }
      });
      console.log('Learning response:', learningResponse.data.getLearning);

      const learningData = learningResponse.data.getLearning;

      // 2. Get chapters
      console.log('Fetching chapters for learning ID:', id);
      const chaptersResponse = await API.graphql({
        query: queries.chaptersByLearningIdAndPosition,
        variables: { 
          learningId: id,
          sortDirection: 'ASC'
        }
      });
      console.log('Chapters response:', chaptersResponse.data.chaptersByLearningIdAndPosition);

      const chapters = chaptersResponse.data.chaptersByLearningIdAndPosition.items
        .sort((a, b) => (a.position || 0) - (b.position || 0));
      console.log('Filtered and sorted chapters:', chapters);

      // 3. Get sections and subsections for each chapter
      const chaptersWithSections = await Promise.all(chapters.map(async chapter => {
        console.log('Fetching sections for chapter:', chapter.id);
        const sectionsResponse = await API.graphql({
          query: queries.sectionsByChapterIdAndPosition,
          variables: { 
            chapterId: chapter.id
          }
        });
        console.log('Sections response for chapter', chapter.id, ':', sectionsResponse.data.sectionsByChapterIdAndPosition);

        const sections = await Promise.all(
          sectionsResponse.data.sectionsByChapterIdAndPosition.items
            .filter(section => !section._deleted)
            .sort((a, b) => a.position - b.position)
            .map(async section => {
              // Get section's post content
              let post = null;
              if (section.postId) {
                console.log('Fetching post for section:', section.id);
                const postResponse = await API.graphql({
                  query: queries.getPost,
                  variables: { id: section.postId }
                });
                post = postResponse.data.getPost;
              }

              // Fetch subsections
              console.log('Fetching subsections for section:', section.id);
              const subSectionsResponse = await API.graphql({
                query: queries.subSectionsBySectionIdAndPosition,
                variables: { 
                  sectionId: section.id,
                  sortDirection: 'ASC'
                }
              });
              console.log('Subsections response for section', section.id, ':', subSectionsResponse.data.subSectionsBySectionIdAndPosition);

              const subSections = await Promise.all(
                subSectionsResponse.data.subSectionsBySectionIdAndPosition.items
                  .filter(subSection => !subSection._deleted)
                  .map(async subSection => {
                    let subSectionPost = null;
                    if (subSection.postId) {
                      console.log('Fetching post for subsection:', subSection.id);
                      const postResponse = await API.graphql({
                        query: queries.getPost,
                        variables: { id: subSection.postId }
                      });
                      subSectionPost = postResponse.data.getPost;
                    }

                    return {
                      ...subSection,
                      post: subSectionPost
                    };
                  })
              );

              return {
                ...section,
                post,
                subSections
              };
            })
        );

        return {
          ...chapter,
          sections
        };
      }));

      console.log('Final chaptersWithSections:', chaptersWithSections);

      setLearning({ ...learningData, chapters: chaptersWithSections });
      setLoading(false);
    } catch (error) {
      console.error("Error fetching learning content:", error);
      setError(error.message);
      setLoading(false);
    }
  };

  // Add toggle function
  const toggleCollapse = (id, e) => {
    e.stopPropagation();
    setCollapsedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Update the click handlers to properly set selected item
  const handleItemClick = (item, type) => {
    // If clicking the same item, do nothing
    if (selectedItem?.id === item.id) return;

    // Set the new selected item
    setSelectedItem({ type, ...item });
  };

  // Update renderChapters to use the new click handler
  const renderChapters = (chapters) => {
    if (!chapters?.length) return (
      <div className="text-center p-4">
        <p className="text-muted mb-3">No chapters found</p>
        <Button
          variant="outline-primary"
          size="sm"
          onClick={() => {
            setModalType('add');
            setItemType('chapter');
            setFormData({ title: '', description: '', content: '', position: 0 });
            setShowModal(true);
          }}
        >
          <span className="me-1">+</span>
          Add First Chapter
        </Button>
      </div>
    );
    
    return chapters.map(chapter => {
      const isChapterActive = selectedItem?.id === chapter.id;
      const sections = Array.isArray(chapter.sections) ? chapter.sections : 
                      chapter.sections?.items ? chapter.sections.items : [];
      const isChapterCollapsed = collapsedItems.has(`chapter-${chapter.id}`);
      
      return (
        <div key={chapter.id} style={styles.chapterItem}>
          <ListGroup.Item
            action
            active={isChapterActive}
            onClick={() => handleItemClick(chapter, 'chapter')}
            className="d-flex justify-content-between align-items-center"
            data-type="chapter"
            style={{
              ...styles.listItem,
              ...(isChapterActive ? styles.activeListItem : {}),
              borderTopLeftRadius: '6px',
              borderTopRightRadius: '6px',
              borderBottomLeftRadius: sections.length && !isChapterCollapsed ? '0' : '6px',
              borderBottomRightRadius: sections.length && !isChapterCollapsed ? '0' : '6px'
            }}
          >
            <div className="d-flex align-items-center flex-grow-1">
              <div 
                style={{
                  ...styles.collapseIcon,
                  transform: isChapterCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)'
                }}
                onClick={(e) => toggleCollapse(`chapter-${chapter.id}`, e)}
              >
                ▼
              </div>
              <div style={styles.itemTitle}>
                <span style={{ fontSize: '1.1em' }}>📚</span>
                <span className="item-title">{chapter.title}</span>
              </div>
            </div>
            <div
              style={{
                ...styles.buttonGroup
              }}
              className="action-buttons"
            >
              <Button 
                style={{
                  ...styles.actionButton,
                  ...(isChapterActive ? { color: 'white', backgroundColor: 'rgba(255, 255, 255, 0.2)', border: '1px solid rgba(255, 255, 255, 0.3)' } : {})
                }}
                variant={isChapterActive ? "outline-light" : "outline-secondary"}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedItem({ type: 'chapter', ...chapter });
                  setRearrangeItems(getRearrangeableItems('section', chapter.id));
                  setShowRearrangeModal(true);
                }}
                title="Rearrange Sections"
              >
                ↕️
              </Button>
              <Button 
                style={{
                  ...styles.actionButton,
                  ...(isChapterActive ? { color: 'white', backgroundColor: 'rgba(255, 255, 255, 0.2)', border: '1px solid rgba(255, 255, 255, 0.3)' } : {})
                }}
                variant={isChapterActive ? "outline-light" : "outline-secondary"}
                onClick={(e) => {
                  e.stopPropagation();
                  setModalType('add');
                  setItemType('section');
                  setSelectedItem({ type: 'chapter', ...chapter });
                  setFormData({ title: '', description: '', content: '', position: 0 });
                  setShowModal(true);
                }}
                title="Add Section"
              >
                +
              </Button>
              <Button
                style={{
                  ...styles.actionButton,
                  ...(isChapterActive ? { color: 'white', backgroundColor: 'rgba(255, 255, 255, 0.2)', border: '1px solid rgba(255, 255, 255, 0.3)' } : {}),
                  color: isChapterActive ? 'white' : '#dc3545'
                }}
                variant={isChapterActive ? "outline-light" : "outline-danger"}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(chapter, 'chapter');
                }}
                title="Delete Chapter"
              >
                🗑️
              </Button>
            </div>
          </ListGroup.Item>
          
          {!isChapterCollapsed && sections.length > 0 && (
            <ListGroup className="py-2">
              {sections.map(section => {
                const isSectionActive = selectedItem?.id === section.id;
                const subSections = Array.isArray(section.subSections) ? section.subSections :
                                  section.subSections?.items ? section.subSections.items : [];
                const isSectionCollapsed = collapsedItems.has(`section-${section.id}`);
                
                return (
                  <div key={section.id} style={styles.sectionItem}>
                    <ListGroup.Item
                      action
                      active={isSectionActive}
                      onClick={() => handleItemClick(section, 'section')}
                      className="d-flex justify-content-between align-items-center"
                      data-type="section"
                      style={{
                        ...styles.listItem,
                        ...(isSectionActive ? styles.activeListItem : {}),
                        borderRadius: '4px'
                      }}
                    >
                      <div className="d-flex align-items-center flex-grow-1">
                        <div 
                          style={{
                            ...styles.collapseIcon,
                            transform: isSectionCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)'
                          }}
                          onClick={(e) => toggleCollapse(`section-${section.id}`, e)}
                        >
                          ▼
                        </div>
                        <div style={styles.itemTitle}>
                          <span style={{ fontSize: '1em' }}>📑</span>
                          <span className="item-title">{section.title}</span>
                        </div>
                      </div>
                      <div
                        style={{
                          ...styles.buttonGroup
                        }}
                        className="action-buttons"
                      >
                        {subSections.length > 0 && (
                          <Button 
                            style={{
                              ...styles.actionButton,
                              ...(isSectionActive ? { color: 'white', backgroundColor: 'rgba(255, 255, 255, 0.2)', border: '1px solid rgba(255, 255, 255, 0.3)' } : {})
                            }}
                            variant={isSectionActive ? "outline-light" : "outline-secondary"}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedItem({ type: 'section', ...section });
                              setRearrangeItems(getRearrangeableItems('subsection', section.id));
                              setShowRearrangeModal(true);
                            }}
                            title="Rearrange Subsections"
                          >
                            ↕️
                          </Button>
                        )}
                        <Button 
                          style={{
                            ...styles.actionButton,
                            ...(isSectionActive ? { color: 'white', backgroundColor: 'rgba(255, 255, 255, 0.2)', border: '1px solid rgba(255, 255, 255, 0.3)' } : {})
                          }}
                          variant={isSectionActive ? "outline-light" : "outline-secondary"}
                          onClick={(e) => {
                            e.stopPropagation();
                            setModalType('add');
                            setItemType('subsection');
                            setSelectedItem({ type: 'section', ...section });
                            setFormData({ title: '', description: '', content: '', position: 0 });
                            setShowModal(true);
                          }}
                          title="Add Subsection"
                        >
                          +
                        </Button>
                        <Button
                          style={{
                            ...styles.actionButton,
                            ...(isSectionActive ? { color: 'white', backgroundColor: 'rgba(255, 255, 255, 0.2)', border: '1px solid rgba(255, 255, 255, 0.3)' } : {}),
                            color: isSectionActive ? 'white' : '#dc3545'
                          }}
                          variant={isSectionActive ? "outline-light" : "outline-danger"}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(section, 'section');
                          }}
                          title="Delete Section"
                        >
                          🗑️
                        </Button>
                      </div>
                    </ListGroup.Item>

                    {!isSectionCollapsed && subSections.length > 0 && (
                      <ListGroup className="py-2">
                        {subSections.map(subSection => {
                          const isSubSectionActive = selectedItem?.id === subSection.id;
                          
                          return (
                            <div key={subSection.id} style={styles.subSectionItem}>
                              <ListGroup.Item
                                action
                                active={isSubSectionActive}
                                onClick={() => handleItemClick(subSection, 'subsection')}
                                className="d-flex justify-content-between align-items-center"
                                data-type="subsection"
                                style={{
                                  ...styles.listItem,
                                  ...(isSubSectionActive ? styles.activeListItem : {}),
                                  borderRadius: '4px'
                                }}
                              >
                                <div className="d-flex align-items-center flex-grow-1">
                                  <div style={{ width: '20px' }}></div>
                                  <div style={styles.itemTitle}>
                                    <span style={{ fontSize: '0.9em' }}>📄</span>
                                    <span className="item-title">{subSection.title}</span>
                                  </div>
                                </div>
                                <div
                                  style={{
                                    ...styles.buttonGroup,
                                    ...(isSubSectionActive ? styles.buttonGroupVisible : {})
                                  }}
                                  className="action-buttons"
                                >
                                  <Button
                                    style={styles.actionButton}
                                    variant={isSubSectionActive ? "outline-light" : "outline-danger"}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDelete(subSection, 'subsection');
                                    }}
                                    title="Delete Subsection"
                                  >
                                    🗑️
                                  </Button>
                                </div>
                              </ListGroup.Item>
                            </div>
                          );
                        })}
                      </ListGroup>
                    )}
                  </div>
                );
              })}
            </ListGroup>
          )}
        </div>
      );
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    if (!selectedItem || !formData.title) {
      setError('Missing required fields');
      return;
    }

    setIsProcessing(true);
    try {
      const input = {
        id: selectedItem.id,
        title: formData.title,
        position: formData.position || 0
      };

      // Update post if it exists
      if (selectedItem.postId && formData.content) {
        await API.graphql({
          query: mutations.updatePost,
          variables: {
            input: {
              id: selectedItem.postId,
              content: formData.content,
              organizationId: learning.organizationId
            }
          }
        });
      } else if (formData.content) {
        // Create new post if content exists but no postId
        const postResponse = await API.graphql({
          query: mutations.createPost,
          variables: {
            input: {
              content: formData.content,
              organizationId: learning.organizationId
            }
          }
        });
        input.postId = postResponse.data.createPost.id;
      }

      // Update the item
      const mutation = selectedItem.type === 'chapter' 
        ? mutations.updateChapter 
        : selectedItem.type === 'section'
        ? mutations.updateSection
        : mutations.updateSubSection;

      const result = await API.graphql({
        query: mutation,
        variables: { input }
      });

      // Update local state
      setLearning(prevLearning => {
        const updatedChapters = prevLearning.chapters.map(ch => {
          if (selectedItem.type === 'chapter' && ch.id === selectedItem.id) {
            return { ...ch, ...result.data[`update${selectedItem.type.charAt(0).toUpperCase() + selectedItem.type.slice(1)}`] };
          } else if (selectedItem.type === 'section') {
            return {
              ...ch,
              sections: ch.sections?.map(sec => 
                sec.id === selectedItem.id 
                  ? { ...sec, ...result.data.updateSection }
                  : sec
              )
            };
          } else if (selectedItem.type === 'subsection') {
            return {
              ...ch,
              sections: ch.sections?.map(sec => ({
                ...sec,
                subSections: sec.subSections?.map(sub =>
                  sub.id === selectedItem.id
                    ? { ...sub, ...result.data.updateSubSection }
                    : sub
                )
              }))
            };
          }
          return ch;
        });

        return { ...prevLearning, chapters: updatedChapters };
      });

      // Update selected item with new data
      setSelectedItem(prev => ({
        ...prev,
        ...result.data[`update${selectedItem.type.charAt(0).toUpperCase() + selectedItem.type.slice(1)}`]
      }));

      setIsEditing(false);
      console.log('Successfully updated item');
      await fetchLearningContent(learningId);
    } catch (error) {
      console.error('Error updating item:', error);
      setError(error.message);
    } finally {
      setIsProcessing(false);
      setIsEditing(false);
    }
  };

  // Handle adding new items
  const handleAdd = async () => {
    if (!learning) {
      setError('Learning data not loaded');
      return;
    }

    setIsProcessing(true);
    try {
      const input = {
        title: formData.title,
        position: formData.position || 0,
        organizationId: learning.organizationId
      };

      console.log('Creating item type:', itemType);
      console.log('Input data:', input);

      if (itemType === 'chapter') {
        // Get current number of chapters to set position
        const chaptersResponse = await API.graphql({
          query: queries.chaptersByLearningIdAndPosition,
          variables: { 
            learningId: learningId,
            sortDirection: 'ASC'
          }
        });
        const currentChapters = chaptersResponse.data.chaptersByLearningIdAndPosition.items;
        
        input.learningId = learningId;
        input.position = currentChapters.length;
        input.organizationId = learning.organizationId;
        console.log('Adding chapter with learningId:', learningId);
      } else if (itemType === 'section') {
        if (!selectedItem?.id) {
          setError('No chapter selected');
          return;
        }
        input.chapterId = selectedItem.id;
        console.log('Adding section to chapter:', selectedItem.id);
      } else if (itemType === 'subsection') {
        if (!selectedItem?.id) {
          setError('No section selected');
          return;
        }
        input.sectionId = selectedItem.id;
        console.log('Adding subsection to section:', selectedItem.id);
      }

      // Create post if content exists
      if (formData.content) {
        const postResponse = await API.graphql({
          query: mutations.createPost,
          variables: {
            input: {
              content: formData.content,
              organizationId: learning.organizationId
            }
          }
        });
        input.postId = postResponse.data.createPost.id;
      }

      // Create the item
      const mutation = itemType === 'chapter' 
        ? mutations.createChapter 
        : itemType === 'section'
        ? mutations.createSection
        : mutations.createSubSection;

      await API.graphql({
        query: mutation,
        variables: { input }
      });

      // Close modal and refresh content
      await fetchLearningContent(learningId);
    } catch (error) {
      console.error('Error adding item:', error);
      setError(error.message);
    } finally {
      setIsProcessing(false);
      setShowModal(false);
    }
  };

  // Handle editing items
  const handleEdit = async () => {
    const input = {
      id: editingItem.id,
      title: formData.title,
      position: formData.position
    };

    // Update post if it exists
    if (editingItem.postId && formData.content) {
      await API.graphql({
        query: mutations.updatePost,
        variables: {
          input: {
            id: editingItem.postId,
            content: formData.content
          }
        }
      });
    } else if (formData.content) {
      // Create new post if it doesn't exist
      const postResponse = await API.graphql({
        query: mutations.createPost,
        variables: {
          input: {
            content: formData.content,
            organizationId: learning.organizationId
          }
        }
      });
      input.postId = postResponse.data.createPost.id;
    }

    // Update the item
    const mutation = itemType === 'chapter' 
      ? mutations.updateChapter 
      : itemType === 'section'
      ? mutations.updateSection
      : mutations.updateSubSection;

    await API.graphql({
      query: mutation,
      variables: { input }
    });
  };

  // Handle deleting items
  const handleDelete = async (item, type) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }

    setIsProcessing(true);
    try {
      console.log('Deleting item:', { item, type });
      
      // Delete associated post first if it exists
      if (item.postId && item.post) {
        console.log('Deleting associated post:', { postId: item.postId, postVersion: item.post._version });
        try {
          await API.graphql({
            query: mutations.deletePost,
            variables: { 
              input: { 
                id: item.postId,
                _version: item.post._version
              } 
            }
          });
          console.log('Post deleted successfully');
        } catch (postError) {
          console.error('Error deleting post:', postError);
          // Don't throw the error, continue with item deletion
          console.log('Continuing with item deletion despite post deletion error');
        }
      }

      // Delete the item
      const mutation = type === 'chapter' 
        ? mutations.deleteChapter 
        : type === 'section'
        ? mutations.deleteSection
        : mutations.deleteSubSection;

      console.log('Attempting to delete:', {
        type,
        itemId: item.id,
        sectionId: type === 'subsection' ? item.sectionId : undefined
      });

      const deleteInput = {
        id: item.id
      };

      // Add _version if available
      if (item._version) {
        deleteInput._version = item._version;
      }

      const deleteResult = await API.graphql({
        query: mutation,
        variables: { 
          input: deleteInput
        }
      });

      console.log('Delete result:', deleteResult);

      // Update UI state
      setLearning(prevLearning => {
        if (type === 'chapter') {
          return {
            ...prevLearning,
            chapters: prevLearning.chapters.filter(ch => ch.id !== item.id)
          };
        } else if (type === 'section') {
          return {
            ...prevLearning,
            chapters: prevLearning.chapters.map(ch => ({
              ...ch,
              sections: ch.sections.filter(sec => sec.id !== item.id)
            }))
          };
        } else if (type === 'subsection') {
          return {
            ...prevLearning,
            chapters: prevLearning.chapters.map(ch => ({
              ...ch,
              sections: ch.sections.map(sec => {
                if (sec.id === item.sectionId) {
                  return {
                    ...sec,
                    subSections: sec.subSections.filter(sub => sub.id !== item.id)
                  };
                }
                return sec;
              })
            }))
          };
        }
        return prevLearning;
      });

      // Clear selection if deleted item was selected
      if (selectedItem?.id === item.id) {
        setSelectedItem(null);
      }
      await fetchLearningContent(learningId);
    } catch (error) {
      console.error('Error deleting item:', error);
      if (error.errors && error.errors.length > 0) {
        console.error('GraphQL Error:', error.errors[0].message);
        setError(`Error deleting ${type}: ${error.errors[0].message}`);
      } else {
        console.error('Error details:', {
          message: error.message,
          errors: error.errors,
          type: type,
          itemId: item.id,
          sectionId: type === 'subsection' ? item.sectionId : undefined
        });
        setError(`Error deleting ${type}: ${error.message}`);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Update renderContentArea to handle loading state
  const renderContentArea = () => {
    if (!selectedItem) {
      return (
        <div className="text-center p-5">
          <h4>Select a chapter, section, or subsection to view content</h4>
        </div>
      );
    }

    if (selectedItem.type === 'chapter') {
      return (
        <div className="text-center p-5">
          <h4>Chapter: {selectedItem.title}</h4>
          <p className="text-muted mt-3">
            Select a section or subsection to view content, or{' '}
            <Button
              variant="link"
              className="p-0"
              onClick={() => {
                setModalType('add');
                setItemType('section');
                setFormData({ title: '', description: '', content: '', position: 0 });
                setShowModal(true);
              }}
            >
              create a new section
            </Button>
          </p>
        </div>
      );
    }

    // For sections and subsections, show the editor
    return (
      <div>
        {isEditing ? (
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Content</Form.Label>
              {imageUploading && (
                <Alert variant="info" className="d-flex align-items-center">
                  <div className="spinner-border spinner-border-sm me-2" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  Uploading image...
                </Alert>
              )}
              <ReactQuill
                ref={quillRef}
                key={`editor-${selectedItem.id}`}
                value={formData.content}
                onChange={(content) => setFormData({ ...formData, content })}
                modules={quillModules}
                formats={quillFormats}
                style={{ height: 'calc(100vh - 300px)', marginBottom: '50px' }}
                placeholder="Start typing your content here. Use the image button in the toolbar to upload images..."
              />
            </Form.Group>
            <div className="d-flex justify-content-end">
              <Button variant="secondary" className="me-2" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={isProcessing}>
                {isProcessing ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </Form>
        ) : (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h4>{selectedItem.title}</h4>
                <p className="text-muted mb-0">
                  {selectedItem.type === 'section' ? 'Section' : 'Subsection'} Content
                </p>
              </div>
              <Button variant="primary" onClick={() => {
                setFormData({
                  title: selectedItem.title,
                  content: selectedItem.post?.content || '',
                  position: selectedItem.position
                });
                setIsEditing(true);
              }}>
                Edit
              </Button>
            </div>
            <div className="ql-editor content-section" dangerouslySetInnerHTML={{ __html: selectedItem.post?.content || '' }} />
          </div>
        )}
      </div>
    );
  };

  // Add this loader component right after the imports
  const LoaderOverlay = () => (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999
      }}
    >
      <div className="text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <div className="mt-2">Processing...</div>
      </div>
    </div>
  );

  // Add this function to handle moving items up and down
  const handleMove = (index, direction) => {
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === rearrangeItems.length - 1)
    ) {
      return;
    }

    const newItems = [...rearrangeItems];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];
    setRearrangeItems(newItems);
  };

  // Add this function to get items by type and parent
  const getRearrangeableItems = (type, parentId = null) => {
    if (type === 'chapter') {
      return learning.chapters.map(chapter => ({
        id: chapter.id,
        title: chapter.title,
        type: 'chapter',
      }));
    } else if (type === 'section' && parentId) {
      const chapter = learning.chapters.find(ch => ch.id === parentId);
      return chapter.sections.map(section => ({
        id: section.id,
        title: section.title,
        type: 'section',
        chapterId: chapter.id
      }));
    } else if (type === 'subsection' && parentId) {
      const section = learning.chapters
        .flatMap(ch => ch.sections)
        .find(sec => sec.id === parentId);
      return section.subSections.map(subsection => ({
        id: subsection.id,
        title: subsection.title,
        type: 'subsection',
        sectionId: section.id
      }));
    }
    return [];
  };

  // Update the handleSaveOrder function
  const handleSaveOrder = async () => {
    setIsProcessing(true);
    try {
      await Promise.all(
        rearrangeItems.map(async (item, index) => {
          const mutation = item.type === 'chapter' 
            ? mutations.updateChapter 
            : item.type === 'section'
            ? mutations.updateSection
            : mutations.updateSubSection;

          const input = {
            id: item.id,
            position: index
          };

          // Maintain parent relationships
          if (item.type === 'section') {
            input.chapterId = item.chapterId;
          } else if (item.type === 'subsection') {
            input.sectionId = item.sectionId;
          }

          await API.graphql({
            query: mutation,
            variables: { input }
          });
        })
      );
      
      await fetchLearningContent(learningId);
      setShowRearrangeModal(false);
    } catch (error) {
      console.error('Error saving order:', error);
      setError(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Update the rearrange modal to show type selection
  const RearrangeModal = () => (
    <Modal show={showRearrangeModal} onHide={() => setShowRearrangeModal(false)} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          Rearrange {selectedItem ? selectedItem.type : 'Chapters'}
          {selectedItem && (
            <small className="d-block text-muted">
              Under: {selectedItem.title}
            </small>
          )}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <ListGroup>
          {rearrangeItems.map((item, index) => (
            <ListGroup.Item key={item.id} className="d-flex justify-content-between align-items-center">
              <div>
                <span className="me-2">
                  {item.type === 'chapter' ? '📚' : item.type === 'section' ? '📑' : '📄'}
                </span>
                {item.title}
              </div>
              <div>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  className="me-2"
                  onClick={() => handleMove(index, 'up')}
                  disabled={index === 0}
                >
                  ↑
                </Button>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => handleMove(index, 'down')}
                  disabled={index === rearrangeItems.length - 1}
                >
                  ↓
                </Button>
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowRearrangeModal(false)}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSaveOrder}>
          Save Changes
        </Button>
      </Modal.Footer>
    </Modal>
  );

  // Add custom CSS for Quill editor
  const additionalStyles = `
    .action-buttons {
      opacity: 1 !important;
    }
    
    .list-group-item:hover .action-buttons button {
      transform: scale(1.05);
    }
    
    .list-group-item.active .action-buttons {
      opacity: 1;
    }
    
    .list-group-item {
      margin-bottom: 2px !important;
      border-radius: 4px !important;
      padding: 0.8rem 1rem !important;
    }
    
    .list-group-item:hover {
      transform: translateX(2px);
      z-index: 1;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }

    /* Action button styles */
    .action-buttons button {
      transition: all 0.2s ease;
    }

    .action-buttons button:hover {
      transform: scale(1.1);
      box-shadow: 0 2px 4px rgba(0,0,0,0.15);
    }
    
    /* Chapter titles */
    .list-group-item .item-title {
      font-weight: 500;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    /* Make item titles show fully on hover */
    .list-group-item:hover .item-title {
      white-space: normal;
      overflow: visible;
    }

    /* Enhanced Quill Editor Styles with Image Upload */
    .ql-editor {
      font-size: 1.1rem;
      line-height: 1.6;
      min-height: 200px;
      padding: 0;
    }

    /* Apply styles to both editor and view mode */
    .ql-editor, div[dangerouslySetInnerHTML] {
      font-size: 1.1rem;
      line-height: 1.6;
    }

    /* Enhanced Image Styles */
    .ql-editor img,
    div[dangerouslySetInnerHTML] img {
      max-width: 100%;
      height: auto;
      margin: 1rem auto;
      display: block;
      cursor: pointer;
      transition: transform 0.2s ease;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .ql-editor img:hover,
    div[dangerouslySetInnerHTML] img:hover {
      transform: scale(1.02);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }

    /* Image upload button styling */
    .ql-toolbar .ql-image {
      position: relative;
    }

    .ql-toolbar .ql-image:hover {
      background-color: #f0f0f0;
    }

    /* Loading state for image upload */
    .image-uploading {
      opacity: 0.7;
      pointer-events: none;
    }

    /* Enhanced Blockquote Styles */
    .ql-editor blockquote,
    div[dangerouslySetInnerHTML] blockquote {
      background-color: #f8f9fa;
      border-left: 4px solid #6c757d;
      margin: 2em 0;
      padding: 1.5em 2em;
      font-style: italic;
      position: relative;
      color: #495057;
    }

    .ql-editor blockquote::before,
    div[dangerouslySetInnerHTML] blockquote::before {
      content: '"';
      font-family: Georgia, serif;
      font-size: 4em;
      position: absolute;
      left: 10px;
      top: -10px;
      color: #6c757d;
      opacity: 0.3;
    }

    .ql-editor blockquote::after,
    div[dangerouslySetInnerHTML] blockquote::after {
      content: '"';
      font-family: Georgia, serif;
      font-size: 4em;
      position: absolute;
      right: 10px;
      bottom: -45px;
      color: #6c757d;
      opacity: 0.3;
    }

    .ql-editor blockquote p,
    div[dangerouslySetInnerHTML] blockquote p {
      margin: 0;
      line-height: 1.8;
      position: relative;
      z-index: 1;
    }

    /* Center aligned text */
    .ql-editor .ql-align-center,
    div[dangerouslySetInnerHTML] .ql-align-center {
      text-align: center !important;
    }

    /* Right aligned text */
    .ql-editor .ql-align-right,
    div[dangerouslySetInnerHTML] .ql-align-right {
      text-align: right !important;
    }

    /* Justify aligned text */
    .ql-editor .ql-align-justify,
    div[dangerouslySetInnerHTML] .ql-align-justify {
      text-align: justify !important;
    }

    /* Left aligned text */
    .ql-editor .ql-align-left,
    div[dangerouslySetInnerHTML] .ql-align-left {
      text-align: left !important;
    }

    .ql-editor table,
    div[dangerouslySetInnerHTML] table {
      width: 100%;
      margin: 1rem 0;
      border-collapse: collapse;
    }

    .ql-editor table td,
    .ql-editor table th,
    div[dangerouslySetInnerHTML] table td,
    div[dangerouslySetInnerHTML] table th {
      border: 1px solid #ddd;
      padding: 8px;
    }

    .ql-editor ul,
    .ql-editor ol,
    div[dangerouslySetInnerHTML] ul,
    div[dangerouslySetInnerHTML] ol {
      margin: 1rem 0;
      padding-left: 2rem;
    }

    /* Image resize handles */
    .ql-editor img.ql-size-large,
    div[dangerouslySetInnerHTML] img.ql-size-large {
      width: 100%;
    }

    .ql-editor img.ql-size-medium,
    div[dangerouslySetInnerHTML] img.ql-size-medium {
      width: 75%;
    }

    .ql-editor img.ql-size-small,
    div[dangerouslySetInnerHTML] img.ql-size-small {
      width: 50%;
    }

    /* Additional styles for view mode */
    div[dangerouslySetInnerHTML] {
      padding: 1rem;
    }

    /* Force alignment styles */
    [class*="ql-align-"] {
      text-align: inherit !important;
    }
    .ql-align-center {
      text-align: center !important;
    }
    .ql-align-right {
      text-align: right !important;
    }
    .ql-align-justify {
      text-align: justify !important;
    }
    .ql-align-left {
      text-align: left !important;
    }

    /* Title wrapping styles */
    .item-title {
      word-wrap: break-word;
      white-space: normal;
      line-height: 1.3;
      overflow-wrap: break-word;
      min-width: 0;
    }

    /* Make chapter titles single line with ellipsis */
    .list-group-item[data-type="chapter"] .item-title {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Allow section and subsection titles to wrap */
    .list-group-item[data-type="section"] .item-title,
    .list-group-item[data-type="subsection"] .item-title {
      white-space: normal;
      overflow-wrap: break-word;
      word-wrap: break-word;
    }

    /* Image upload indicator */
    .ql-toolbar .ql-image.image-uploading::after {
      content: '⟳';
      position: absolute;
      top: 2px;
      right: 2px;
      font-size: 10px;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;

  // Add function to handle view button click
  const handleViewClick = () => {
    window.open(`/learning/${learningId}/view`, '_blank');
  };

  return (
    <Container fluid>
      <Row>
        <Col md={4} style={styles.sidePanel}>
          <div style={styles.sidePanelHeader}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0 fw-bold">Content Structure</h5>
              <Button
                variant="outline-primary"
                size="sm"
                onClick={handleViewClick}
                title="Open in View Mode"
                className="d-flex align-items-center"
                style={{ minWidth: '80px', justifyContent: 'center' }}
              >
                <span className="me-1">👁️</span>
                View
              </Button>
            </div>
            <div className="d-flex gap-2 mt-3">
              <Button
                variant="outline-primary"
                size="sm"
                className="flex-grow-1 py-2"
                onClick={() => {
                  setSelectedItem(null);
                  setRearrangeItems(getRearrangeableItems('chapter'));
                  setShowRearrangeModal(true);
                }}
              >
                <span className="me-1">↕️</span>
                Rearrange
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="flex-grow-1 py-2"
                onClick={() => {
                  setModalType('add');
                  setItemType('chapter');
                  setFormData({ title: '', description: '', content: '', position: 0 });
                  setShowModal(true);
                }}
              >
                <span className="me-1">+</span>
                Add Chapter
              </Button>
            </div>
          </div>
          <div style={styles.sidePanelContent}>
            <ListGroup variant="flush" className="compact-list">
              {loading ? (
                <div className="text-center p-3">
                  <div className="spinner-border spinner-border-sm text-primary me-2" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  Loading content...
                </div>
              ) : error ? (
                <Alert variant="danger">{error}</Alert>
              ) : (
                renderChapters(learning?.chapters || [])
              )}
            </ListGroup>
          </div>
        </Col>
        <Col md={8} className="vh-100 overflow-auto p-3">
          {renderContentArea()}
        </Col>
      </Row>
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            Add {itemType.charAt(0).toUpperCase() + itemType.slice(1)}
            {itemType === 'section' && selectedItem && (
              <small className="d-block text-muted">
                Under Chapter: {selectedItem.title}
              </small>
            )}
            {itemType === 'subsection' && selectedItem && (
              <small className="d-block text-muted">
                Under Section: {selectedItem.title}
              </small>
            )}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={(e) => {
            e.preventDefault();
            handleAdd();
          }}>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </Form.Group>
            {itemType !== 'chapter' && (
              <Form.Group className="mb-3">
                <Form.Label>Content</Form.Label>
                {imageUploading && (
                  <Alert variant="info" className="d-flex align-items-center">
                    <div className="spinner-border spinner-border-sm me-2" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    Uploading image...
                  </Alert>
                )}
                <ReactQuill
                  ref={quillRef}
                  value={formData.content}
                  onChange={(content) => setFormData({ ...formData, content })}
                  modules={quillModules}
                  formats={quillFormats}
                  style={{ height: '300px', marginBottom: '50px' }}
                  placeholder="Start typing your content here. Use the image button in the toolbar to upload images..."
                />
              </Form.Group>
            )}
            <div className="d-flex justify-content-end">
              <Button variant="secondary" className="me-2" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={isProcessing}>
                {isProcessing ? 'Adding...' : `Add ${itemType}`}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
      <RearrangeModal />
      {isProcessing && <LoaderOverlay />}
      <style>{additionalStyles}</style>
    </Container>
  );
};

const styles = {
  listItem: {
    padding: '0.75rem 1rem',
    fontSize: '0.95rem',
    borderLeft: '3px solid transparent',
    transition: 'all 0.2s ease',
    backgroundColor: 'var(--bs-white)',
    marginBottom: '2px',
    borderRadius: '4px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  activeListItem: {
    borderLeft: '3px solid var(--bs-primary)',
    backgroundColor: 'var(--bs-primary)',
    color: 'white',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  buttonGroup: {
    opacity: 1,
    display: 'flex',
    gap: '6px',
    marginLeft: '10px'
  },
  buttonGroupVisible: {
    opacity: 1
  },
  actionButton: {
    padding: '4px 8px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
    border: '1px solid var(--bs-gray-300)',
    backgroundColor: 'white',
    transition: 'all 0.2s ease',
    width: '32px',
    height: '32px',
    fontSize: '14px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
  },
  collapseIcon: {
    transition: 'transform 0.2s ease',
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: 'var(--bs-gray-600)'
  },
  itemTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flex: 1,
    fontSize: '0.95rem',
    minWidth: 0,
  },
  sidePanel: {
    backgroundColor: 'var(--bs-gray-100)',
    borderRight: '1px solid var(--bs-gray-300)',
    padding: '0',
    height: '100vh',
    overflow: 'auto'
  },
  sidePanelHeader: {
    padding: '1.2rem',
    backgroundColor: 'white',
    borderBottom: '1px solid var(--bs-gray-300)',
    position: 'sticky',
    top: '0',
    zIndex: '1000',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
  },
  sidePanelContent: {
    padding: '1.2rem'
  },
  chapterItem: {
    backgroundColor: 'white',
    borderRadius: '6px',
    marginBottom: '0.8rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
  },
  sectionItem: {
    backgroundColor: 'var(--bs-gray-50)',
    borderRadius: '4px',
    marginLeft: '1.8rem',
    marginTop: '0.3rem',
    marginBottom: '0.3rem'
  },
  subSectionItem: {
    backgroundColor: 'var(--bs-gray-100)',
    marginLeft: '1.8rem',
    marginTop: '0.3rem',
    marginBottom: '0.3rem',
    borderRadius: '4px'
  }
};

export default LearningEditEnhanced;