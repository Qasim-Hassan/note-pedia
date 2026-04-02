import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate, useParams, Outlet, useOutletContext } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css"
import { Badge, Button, Card, Col, Container, Form, Modal, Row, Stack } from "react-bootstrap";
import CreatableReactSelect from "react-select/creatable"
import ReactSelect from "react-select";
import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import ReactMarkdown from "react-markdown";
import { v4 as uuidv4 } from "uuid";
import styles from "./NoteList.module.css"

const root = createRoot(document.getElementById("root")!);

//all our custom data types...
type Note = {
    id: string
} & NoteData;

type NoteData = {
    title: string,
    body: string,
    tags: Tag[]
}

type NoteLayoutProps= {
    notes: Note[]
}

type NoteListp = {
    availableTags: Tag[],
    notes: SimplifiedNotes[],
    updateTag:  (id: string , label: string) => void,
    deleteTag: (id: string) => void
}

type RawNote = {
    id: string
}&RawNoteData;

type RawNoteData = {
    title: string,
    body: string,
    tagIds: string[]
}

type Tag = {
    id: string,
    label: string
}

type NoteFormProps = {
    theSubmit: (data: NoteData) => void,
    onAddTag: (tag: Tag) => void,
    availableTags: Tag[]
}& Partial<NoteData>

type SimplifiedNotes ={
    tags: Tag[],
    title: string,
    id: string
}

type DeleteNoteProps ={
    onDelete: (id: string) => void
}

type EditTagsProps ={
    availableTags: Tag[],
    show: boolean,
    hideFn: ()=> void
    onUpdateTag: (id: string, label: string) => void,
    onDeleteTag: (id: string) => void
}

//all the utility functions program need...
function useLocalStorage<T>(key: string, initVal: T | (()=> T)){
    const [value, setValue] = useState<T>(() => {
        const jsonValue = localStorage.getItem(key)
        if (jsonValue == null){
            if (typeof initVal === "function"){
                return (initVal as ()=> T)()
            }else{
                return initVal
            }
        }else{
            return JSON.parse(jsonValue)
        }
    });

    useEffect(()=>{
        localStorage.setItem(key, JSON.stringify(value))
    }, [value, key])

    return [value, setValue] as [T, typeof setValue]
}

function NoteLayout({notes}: NoteLayoutProps){
    const {id} = useParams();
    const note = notes.find(n => n.id === id);
    if (note == null){
        return <Navigate to="/" replace/>
    }

    return(
        <Outlet context={note}/>
    )
}

function useNote(){
    return useOutletContext<Note>()
}

//  <=== all the components are here... ===>
function EditTagsModal({availableTags, show, hideFn, onUpdateTag, onDeleteTag}: EditTagsProps){
    return(
        <Modal show={show} onHide={hideFn} >
            <Modal.Header closeButton>
                <Modal.Title>Edit Tags</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <Stack gap={2}>
                        {availableTags.map((tag: Tag)=>{
                            return (
                                <Row key={tag.id}>
                                    <Col>
                                        <Form.Control type="text" onChange={(e)=> onUpdateTag(tag.id, e.target.value)} value={tag.label}/>
                                    </Col>
                                    <Col xs="auto">
                                        <Button onClick={()=> onDeleteTag(tag.id)} variant="outline-danger">&times;</Button>
                                    </Col>
                                </Row>
                            )
                        })}
                    </Stack>
                </Form>
            </Modal.Body>
        </Modal>
    )
}


function NoteForm({theSubmit, onAddTag, availableTags}: NoteFormProps){
    const titleRef = useRef<HTMLInputElement>(null);
    const markdownRef = useRef<HTMLTextAreaElement>(null);
    const [selectedTags, setSelectedTags] = useState<Tag[]>([])
    const navigate = useNavigate()

    function handleSubmit(e: FormEvent){
        e.preventDefault();

        theSubmit({
            title: titleRef.current!.value,
            body: markdownRef.current!.value,
            tags: selectedTags
        })

        navigate("..")

    }
    return(
        <>
            <Form onSubmit={handleSubmit}>
                <Stack gap={4}>
                    <Row>
                        <Col>
                            <Form.Group controlId="title">
                                <Form.Label>Title</Form.Label>
                                <Form.Control ref={titleRef} required />
                            </Form.Group>
                        </Col>
                        <Col>
                            <Form.Group controlId="tags">
                                <Form.Label>Tags</Form.Label>
                                <CreatableReactSelect 
                                onCreateOption={label => {
                                    const newTag = {id: uuidv4(), label}
                                    onAddTag(newTag);
                                    setSelectedTags(prevTags => [...prevTags, newTag])
                                }}
                                value={selectedTags.map(t=>{
                                    return {label: t.label, value: t.id}
                                })}
                                options={availableTags.map(a=>{
                                    return {label: a.label, value: a.id}
                                })}
                                onChange={tags => {setSelectedTags(tags.map( tag=> {
                                    return {label: tag.label, id: tag.value}
                                }))}}
                                isMulti />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Form.Group controlId="markdown">
                        <Form.Label>Body</Form.Label>
                        <Form.Control ref={markdownRef} required as="textarea" rows={15}/>
                    </Form.Group>
                    <Stack direction="horizontal" gap={2} className="justify-content-end">
                        <Button type="submit" variant="primary">Save</Button>
                        <Link to="..">
                            <Button type="button" variant="outline-secondary">Cancel</Button>
                        </Link>
                    </Stack>
                </Stack>
            </Form>
        </>
    )
}


function NewNote({submitFn, onAddTag, availableTags}: any){
    return(
        <>
            <h1 className="mb-4">New Note</h1>
            <NoteForm theSubmit={submitFn} onAddTag={onAddTag} availableTags={availableTags}/>
        </>
    )
}

function EditNoteForm({theSubmit, onAddTag, availableTags, title="", body="", tags=[]}: NoteFormProps){
    const titleRef = useRef<HTMLInputElement>(null);
    const markdownRef = useRef<HTMLTextAreaElement>(null);
    const [selectedTags, setSelectedTags] = useState<Tag[]>(tags)
    const navigate = useNavigate()

    function handleSubmit(e: FormEvent){
        e.preventDefault();

        theSubmit({
            title: titleRef.current!.value,
            body: markdownRef.current!.value,
            tags: selectedTags
        })

        navigate("..")

    }
    return(
        <>
            <Form onSubmit={handleSubmit}>
                <Stack gap={4}>
                    <Row>
                        <Col>
                            <Form.Group controlId="title">
                                <Form.Label>Title</Form.Label>
                                <Form.Control ref={titleRef} required defaultValue={title} />
                            </Form.Group>
                        </Col>
                        <Col>
                            <Form.Group controlId="tags">
                                <Form.Label>Tags</Form.Label>
                                <CreatableReactSelect 
                                onCreateOption={label => {
                                    const newTag = {id: uuidv4(), label}
                                    onAddTag(newTag);
                                    setSelectedTags(prevTags => [...prevTags, newTag])
                                }}
                                value={selectedTags.map(t=>{
                                    return {label: t.label, value: t.id}
                                })}
                                options={availableTags.map(a=>{
                                    return {label: a.label, value: a.id}
                                })}
                                onChange={tags => {setSelectedTags(tags.map( tag=> {
                                    return {label: tag.label, id: tag.value}
                                }))}}
                                isMulti />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Form.Group controlId="markdown">
                        <Form.Label>Body</Form.Label>
                        <Form.Control ref={markdownRef} required as="textarea" rows={15} defaultValue={body}/>
                    </Form.Group>
                    <Stack direction="horizontal" gap={2} className="justify-content-end">
                        <Button type="submit" variant="primary">Save</Button>
                        <Link to="..">
                            <Button type="button" variant="outline-secondary">Cancel</Button>
                        </Link>
                    </Stack>
                </Stack>
            </Form>
        </>
    )
}

function EditNote({submitFn, onAddTag, availableTags}: any){
    const note = useNote()

    return(
        <>
            <h1 className="mb-4">Edit Note</h1>
            <EditNoteForm
             title= {note.title}
             body = {note.body}
             tags = {note.tags}
             theSubmit={data=> submitFn(note.id, data)}
             onAddTag={onAddTag}
             availableTags={availableTags}/>
        </>
    )
}

function ShowNotes({onDelete}: DeleteNoteProps){
    const note = useNote()
    const navigate = useNavigate()
    return(
        <>
            <Row className="align-items-center mb-4">
                <Col>
                    <h1>{note.title}</h1>
                    {note.tags.length > 0 && (
                        <Stack gap={1} direction="horizontal" className="flex-wrap" >
                            {note.tags.map(tag => ( <Badge className="text-truncates" key={tag.id}>{tag.label}</Badge>))}
                        </Stack>
                    )}
                </Col>
                <Col xs="auto">
                    <Stack direction="horizontal" gap={2}>
                        <Link to={`/${note.id}/edit`}>
                            <Button variant="primary">Edit</Button>
                        </Link>
                        <Link to="/">
                            <Button onClick={()=> {
                                onDelete(note.id);
                                navigate("/")
                            }} variant="outline-danger">Delete</Button>
                        </Link>
                        <Link to="..">
                            <Button variant="outline-secondary">Back</Button>
                        </Link>
                    </Stack>
                </Col>
            </Row>
            <ReactMarkdown>{note.body}</ReactMarkdown>
        </>
    )
}

function NoteCard({id, title, tags}: SimplifiedNotes){
    return(
        <Card as={Link} to={`/${id}`} className= {`h-100 text-reset text-decoration-none ${styles.card}`}>
            <Card.Body>
                <Stack gap={2} className="align-items-center justify-content-center h-100">
                    <span className="fs-5">{title}</span>
                    {tags.length > 0 && (
                        <Stack gap={1} direction="horizontal" className="justify-content-center flex-wrap" >
                            {tags.map(tag => ( <Badge className="text-truncates" key={tag.id}>{tag.label}</Badge>))}
                        </Stack>
                    )}
                </Stack>
            </Card.Body>
        </Card>
    )
}

function NoteList({availableTags, notes, updateTag, deleteTag}: NoteListp){
    const [selectedTags, setSelectedTags] = useState<Tag[]>([])
    const [title, setTitle] = useState("");
    const [showAllow, setShowAllow] = useState(false)

    const filterednotes = useMemo(()=>{
        return notes.filter(note=> {
            return (title ==="" || note.title.toLowerCase().includes(title.toLowerCase())) && (selectedTags.length === 0 || selectedTags.every(tag => (
                note.tags.some(noteTag => noteTag.id === tag.id)
            )))
        })
    }, [title, selectedTags, notes])

    return (
        <>
            <Row className="align-items-center mb-4">
                <Col><h1>Notes</h1></Col>
                <Col xs="auto">
                    <Stack direction="horizontal" gap={2}>
                        <Link to="/new">
                            <Button variant="primary">Create</Button>
                        </Link>
                        <Button variant="outline-secondary" onClick={() => setShowAllow(true)}>Edit Tags</Button>
                    </Stack>
                </Col>
            </Row>
            <Form>
                <Row className="mb-4">
                    <Col>
                        <Form.Group controlId="title">
                            <Form.Label>Title</Form.Label>
                            <Form.Control type="text" value={title} onChange={(e => setTitle(e.target.value))}/>
                        </Form.Group>
                    </Col>
                    <Col>
                        <Form.Group controlId="tags">
                            <Form.Label>Tags</Form.Label>
                            <ReactSelect 
                            value={selectedTags.map(t=>{
                                return {label: t.label, value: t.id}
                            })}
                            options={availableTags.map((a:any)=>{
                                return {label: a.label, value: a.id}
                            })}
                            onChange={tags => {setSelectedTags(tags.map( tag=> {
                                return {label: tag.label, id: tag.value}
                            }))}}
                            isMulti />
                        </Form.Group>
                    </Col>
                </Row>
            </Form>
            <Row xs={1} sm={2} lg={3} xl={4} className="g-3">
                {filterednotes.map((note)=>{
                    return(
                        <Col key={note.id}>
                            <NoteCard id={note.id} title={note.title} tags={note.tags}/>
                        </Col>
                    )
                })}
            </Row>
            <EditTagsModal availableTags={availableTags} show={showAllow} hideFn={()=> setShowAllow(false)} onUpdateTag={updateTag} onDeleteTag={deleteTag}/>
        </>
    )
}

function App(){
    const [notes, setNotes] = useLocalStorage<RawNote[]>("NOTES", []);
    const [tags, setTags] = useLocalStorage<Tag[]>("TAGS", []);

    //convert RawNotes to Notes
    const notesWithTags = useMemo(()=>{
        return notes.map(note => {
            return {...note, tags: tags.filter(tag => note.tagIds.includes(tag.id))}
        })
    }, [notes , tags])

    function onCreateNote({tags, ...data}: NoteData){
        setNotes(prevNotes => {
            return [...prevNotes, {...data, id: uuidv4(), tagIds: tags.map(t=>t.id)}]
        })
    }

    function onEditNote(id: string, {tags, ...data}: NoteData){
        setNotes(prev=>{
            return prev.map(note => {
                if (note.id === id){
                    return {...note,...data, tagIds: tags.map(t=>t.id)}
                }else{
                    return note
                }
            })
        })
    }

    function onDeleteNote(id: string){
        setNotes(prev=>{
            return prev.filter(note=> note.id !== id)
        })
    }

    function addTags(tag: Tag){
        setTags(prev => [...prev, tag])
    }

    function updateTag(id: string, label:string){
        setTags(prev=>{
            return prev.map(tag => {
                if (tag.id === id){
                    return {...tag, label: label}
                }else{
                    return tag
                }
            })
        })
    }

    function deleteTag(id: string){
        setTags(prev=>{
            return prev.filter(tag=> tag.id !== id)
        })
    }

    return(
        <Container className="my-4">
            <Routes>
                <Route path="/" element={<NoteList availableTags={tags} notes={notesWithTags} updateTag={updateTag} deleteTag={deleteTag}/>} />
                <Route path="/new" element={<NewNote submitFn={onCreateNote} onAddTag={addTags} availableTags={tags}/>} />
                <Route path="/:id" element={<NoteLayout notes={notesWithTags}/>}>
                    <Route index element={<ShowNotes onDelete={onDeleteNote}/>}/>
                    <Route path="edit" element={<EditNote submitFn={onEditNote} onAddTag={addTags} availableTags={tags}/>} />
                </Route>
                <Route path="*" element={<Navigate to="/"/>} />
            </Routes>
        </Container>
    )
}

root.render(
   <BrowserRouter>
        <App/>
   </BrowserRouter>
)
